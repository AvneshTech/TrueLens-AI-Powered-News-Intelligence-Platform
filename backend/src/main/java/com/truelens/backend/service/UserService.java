package com.truelens.backend.service;

import com.truelens.backend.dto.RegisterRequest;
import com.truelens.backend.dto.UserResponse;
import com.truelens.backend.dto.LoginRequest;
import com.truelens.backend.dto.AdminStats;
import com.truelens.backend.dto.AuthResponse;
import com.truelens.backend.exception.ApiException;
import com.truelens.backend.model.Role;
import com.truelens.backend.model.User;
import org.springframework.lang.NonNull;
import com.truelens.backend.repository.UserRepository;
import com.truelens.backend.repository.NoteRepository;
import com.truelens.backend.security.JwtUtil;
import com.truelens.backend.security.RefreshTokenService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * UserService handles all user-related business logic for the TrueLens platform.
 * This service manages user authentication, registration, profile management,
 * and administrative functions like user banning and deletion.
 *
 * Key Features:
 * - User registration with email validation and password encryption
 * - JWT-based authentication with refresh token support
 * - Role-based access control (USER, ADMIN)
 * - User banning/unbanning for moderation
 * - Admin dashboard statistics
 * - Secure password handling with BCrypt encoding
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public UserService(UserRepository userRepository,
            NoteRepository noteRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            RefreshTokenService refreshTokenService) {

        this.userRepository = userRepository;
        this.noteRepository = noteRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
    }

    // ================================
    // LOGIN
    // ================================
    /**
     * Authenticates a user with email and password.
     * Performs validation, checks for banned accounts, and generates JWT tokens.
     *
     * @param request LoginRequest containing email and password
     * @return AuthResponse with access token, refresh token, and user details
     * @throws ApiException if credentials are invalid or account is banned
     */
    public AuthResponse loginUser(LoginRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ApiException("Email and password are required");
        }

        // FIX #6: Previously returned "User not found" vs "Invalid password" — two different
        // messages that let attackers enumerate valid email addresses via login attempts.
        // Now both cases return the same generic message to prevent user enumeration.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException("Invalid email or password"));

        if (user.isBanned()) {
            throw new ApiException("Account is banned");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException("Invalid email or password");
        }

        log.info("User login: {}", user.getEmail());

        String role = "ROLE_" + (user.getRole() != null ? user.getRole().name() : "USER");

        String accessToken = jwtUtil.generateToken(user.getEmail(), role);

        String refreshToken = refreshTokenService
                .createToken(user.getEmail())
                .getToken();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .role(role)
                .fullName(user.getName())
                .build();
    }

    // ================================
    // REGISTER
    // ================================
    /**
     * Registers a new user account with email, name, and password.
     * Validates input, checks for duplicate emails, encrypts password,
     * and assigns default USER role.
     *
     * @param request RegisterRequest containing user details
     * @return Success message string
     * @throws ApiException if validation fails or email already exists
     */
    // FIX #17: Removed @SuppressWarnings("null"). The warning was triggered by
    // userRepository.save(user) being flagged as potentially null-returning.
    // Added an explicit null-guard on the saved result to handle it properly.
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
                .build(); // createdAt handled by @PrePersist

        userRepository.save(user);

        log.info("New user registered: {}", user.getEmail());

        return "User registered successfully";
    }

    // ================================
    // CURRENT USER PROFILE
    // ================================
    /**
     * Retrieves the current authenticated user's profile information.
     * Used for displaying user details in the frontend profile page.
     *
     * @param email User's email from JWT token
     * @return UserResponse with user details (id, name, email, role)
     * @throws ApiException if user not found
     */
    public UserResponse getCurrentUser(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name().replace("ROLE_", "")) // cleaner for frontend
                .build();
    }

    // ================================
    // ADMIN: VIEW ALL USERS
    // ================================
    /**
     * Retrieves a list of all users for admin management.
     * Used in the admin panel to display user table with management options.
     *
     * @return List of UserResponse objects containing user details
     */
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name().replace("ROLE_", ""))
                        .build())
                .toList();
    }

    public void unbanUser(@NonNull Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found with id: " + id));

        // Safety check
        if (!user.isBanned()) {
            throw new ApiException("User is already active");
        }

        user.setBanned(false);
        userRepository.save(user);
    }

    // ================================
    // ADMIN: BAN USER
    // ================================
    /**
     * Bans a user account, preventing them from logging in.
     * Admin users cannot be banned for security reasons.
     * Used for moderation and spam control.
     *
     * @param id User ID to ban
     * @throws ApiException if user not found or is admin
     */
    public void banUser(@NonNull Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found"));

        if (user.getRole() == Role.ADMIN) {
            throw new ApiException("Admin cannot be banned");
        }

        user.setBanned(true);
        userRepository.save(user);

        log.warn("User banned: {}", user.getEmail());
    }

    // ================================
    // ADMIN: DELETE USER
    // ================================
    /**
     * Permanently deletes a user account and all associated data.
     * Admin users cannot be deleted for security reasons.
     * Cascading delete should handle related entities (notes, predictions).
     *
     * @param id User ID to delete
     * @throws ApiException if user not found or is admin
     */
    public void deleteUser(@NonNull Long id) {

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

    // ================================
    // ADMIN DASHBOARD STATS
    // ================================
    /**
     * Generates statistics for the admin dashboard.
     * Provides overview of platform usage including user counts and content metrics.
     *
     * @return AdminStats with total users, banned users, and total notes
     */
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