package com.truelens.backend.service;

import com.truelens.backend.dto.RegisterRequest;
import com.truelens.backend.dto.UserResponse;
import com.truelens.backend.dto.LoginRequest;
import com.truelens.backend.dto.AdminStats;
import com.truelens.backend.dto.AuthResponse;
import com.truelens.backend.exception.ApiException;
import com.truelens.backend.model.Role;
import com.truelens.backend.model.NotificationType;
import com.truelens.backend.model.TokenType;
import com.truelens.backend.model.User;
import com.truelens.backend.model.VerificationToken;
import org.springframework.lang.NonNull;
import com.truelens.backend.repository.UserRepository;
import com.truelens.backend.repository.NoteRepository;
import com.truelens.backend.repository.VerificationTokenRepository;
import com.truelens.backend.security.JwtUtil;
import com.truelens.backend.security.RefreshTokenService;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * UserService — authentication, registration, profile, and admin moderation.
 *
 * PHASE 3 additions: email-verification gating on login, plus verify / resend /
 * forgot-password / reset-password flows backed by single-use, expiring tokens
 * (VerificationToken) and Resend transactional email (EmailService).
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private static final long VERIFY_TTL_HOURS = 24;
    private static final long RESET_TTL_MINUTES = 60;

    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public UserService(UserRepository userRepository,
            NoteRepository noteRepository,
            VerificationTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            RefreshTokenService refreshTokenService,
            EmailService emailService,
            NotificationService notificationService) {

        this.userRepository = userRepository;
        this.noteRepository = noteRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    // ================================ LOGIN ================================
    public AuthResponse loginUser(LoginRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ApiException("Email and password are required");
        }

        // Generic message prevents user-enumeration via login.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("Invalid email or password"));

        if (user.isBanned()) {
            throw new ApiException("Account is banned");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException("Invalid email or password");
        }

        // PHASE 3: block login until the email is verified.
        if (!user.isVerified()) {
            throw new ApiException(
                    "Please verify your email before logging in. Check your inbox or request a new link.",
                    HttpStatus.FORBIDDEN);
        }

        log.info("User login: {}", user.getEmail());

        String role = "ROLE_" + (user.getRole() != null ? user.getRole().name() : "USER");
        String accessToken = jwtUtil.generateToken(user.getEmail(), role);
        String refreshToken = refreshTokenService.createToken(user.getEmail()).getToken();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .role(role)
                .fullName(user.getName())
                .build();
    }

    // ================================ REGISTER ================================
    public String registerUser(RegisterRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ApiException("Email is required");
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new ApiException("Name is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ApiException("Password is required");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException("Email already registered");
        }

        User user = User.builder()
                .name(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .banned(false)
                .verified(false) // PHASE 3: inactive until verified
                .build();

        userRepository.save(user);
        log.info("New user registered (unverified): {}", user.getEmail());

        // Issue + email a verification token.
        issueAndSendVerification(user);

        return "Registration successful. Please check your email to verify your account.";
    }

    // ======================= EMAIL VERIFICATION =======================
    public String verifyEmail(String token) {
        VerificationToken vt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Invalid or expired verification link"));

        if (vt.getType() != TokenType.VERIFY_EMAIL || vt.isUsed() || vt.isExpired()) {
            throw new ApiException("Invalid or expired verification link");
        }

        User user = userRepository.findByEmail(vt.getEmail())
                .orElseThrow(() -> new ApiException("User not found"));

        user.setVerified(true);
        userRepository.save(user);

        tokenRepository.delete(vt); // single-use

        notificationService.create(user.getEmail(), "Welcome to TrueLens 🎉",
                "Your email has been verified. Your account is now active.",
                NotificationType.ACCOUNT, "/");

        log.info("Email verified: {}", user.getEmail());

        return "Email verified successfully. You can now log in.";
    }

    public String resendVerification(String email) {
        // Always return a generic message (no account enumeration).
        userRepository.findByEmail(email).ifPresent(user -> {
            if (!user.isVerified()) {
                issueAndSendVerification(user);
            }
        });
        return "If an unverified account exists for that email, a new verification link has been sent.";
    }

    private void issueAndSendVerification(User user) {
        tokenRepository.deleteByEmailAndType(user.getEmail(), TokenType.VERIFY_EMAIL);

        VerificationToken vt = VerificationToken.builder()
                .token(UUID.randomUUID().toString())
                .email(user.getEmail())
                .type(TokenType.VERIFY_EMAIL)
                .expiresAt(LocalDateTime.now().plusHours(VERIFY_TTL_HOURS))
                .used(false)
                .build();
        tokenRepository.save(vt);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), vt.getToken());
    }

    // ======================= PASSWORD RESET =======================
    public String forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            tokenRepository.deleteByEmailAndType(user.getEmail(), TokenType.PASSWORD_RESET);

            VerificationToken vt = VerificationToken.builder()
                    .token(UUID.randomUUID().toString())
                    .email(user.getEmail())
                    .type(TokenType.PASSWORD_RESET)
                    .expiresAt(LocalDateTime.now().plusMinutes(RESET_TTL_MINUTES))
                    .used(false)
                    .build();
            tokenRepository.save(vt);

            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), vt.getToken());
        });
        return "If an account exists for that email, a password-reset link has been sent.";
    }

    public String resetPassword(String token, String newPassword) {
        VerificationToken vt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Invalid or expired reset link"));

        if (vt.getType() != TokenType.PASSWORD_RESET || vt.isUsed() || vt.isExpired()) {
            throw new ApiException("Invalid or expired reset link");
        }

        User user = userRepository.findByEmail(vt.getEmail())
                .orElseThrow(() -> new ApiException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenRepository.delete(vt);                       // single-use
        refreshTokenService.deleteByEmail(user.getEmail()); // force re-login everywhere

        log.info("Password reset: {}", user.getEmail());
        return "Password reset successfully. You can now log in with your new password.";
    }

    // ======================= PROFILE =======================
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name().replace("ROLE_", ""))
                .banned(user.isBanned())
                .build();
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name().replace("ROLE_", ""))
                        .banned(user.isBanned())
                        .build())
                .toList();
    }

    // ======================= ADMIN MODERATION =======================
    public void unbanUser(@NonNull String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found with id: " + id));
        if (!user.isBanned()) {
            throw new ApiException("User is already active");
        }
        user.setBanned(false);
        userRepository.save(user);
    }

    public void banUser(@NonNull String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found"));
        if (user.getRole() == Role.ADMIN) {
            throw new ApiException("Admin cannot be banned");
        }
        user.setBanned(true);
        userRepository.save(user);
        log.warn("User banned: {}", user.getEmail());
    }

    public void deleteUser(@NonNull String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found"));
        if (user.getRole() == Role.ADMIN) {
            throw new ApiException("Admin cannot be deleted");
        }
        userRepository.delete(user);
        log.warn("User deleted: {}", user.getEmail());
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found"));
    }

    // ======================= ADMIN STATS =======================
    public AdminStats getAdminStats() {
        long totalUsers = userRepository.count();
        long bannedUsers = userRepository.countByBannedTrue();
        long totalNotes = noteRepository.count();

        return AdminStats.builder()
                .totalUsers(totalUsers)
                .bannedUsers(bannedUsers)
                .totalNotes(totalNotes)
                .build();
    }
}
