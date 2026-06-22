package com.truelens.backend.controller;

import com.truelens.backend.dto.LoginRequest;
import com.truelens.backend.dto.RegisterRequest;
import com.truelens.backend.dto.UserResponse;
import com.truelens.backend.dto.AuthResponse;
import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.dto.ForgotPasswordRequest;
import com.truelens.backend.dto.ResetPasswordRequest;
import com.truelens.backend.exception.ApiException;
import com.truelens.backend.model.RefreshToken;
import com.truelens.backend.model.User;
import com.truelens.backend.security.JwtUtil;
import com.truelens.backend.security.RefreshTokenService;
import com.truelens.backend.security.TokenBlacklistService;
import com.truelens.backend.service.UserService;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import jakarta.validation.Valid;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final UserService userService;
    private final TokenBlacklistService blacklistService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService,
                          TokenBlacklistService blacklistService,
                          RefreshTokenService refreshTokenService,
                          JwtUtil jwtUtil) {
        this.userService = userService;
        this.blacklistService = blacklistService;
        this.refreshTokenService = refreshTokenService;
        this.jwtUtil = jwtUtil;
    }

    // =========================
    // ✅ REGISTER
    // =========================
    @PostMapping("/register")
    public ApiResult<String> register(@Valid @RequestBody RegisterRequest request) {

        String msg = userService.registerUser(request);

        return ApiResult.<String>builder()
                .success(true)
                .message(msg)
                .data(null)
                .build();
    }

    // =========================
    // ✅ LOGIN
    // =========================
    @PostMapping("/login")
    public ApiResult<AuthResponse> login(@Valid @RequestBody LoginRequest request) {

        AuthResponse response = userService.loginUser(request);

        return ApiResult.<AuthResponse>builder()
                .success(true)
                .message("Login successful")
                .data(response)
                .build();
    }

    // =========================
    // ✅ CURRENT USER
    // =========================
    @GetMapping("/me")
    public UserResponse getCurrentUser(Authentication auth) {
        return userService.getCurrentUser(auth.getName());
    }

    // =========================
    // ✅ LOGOUT (IMPROVED 🔥)
    // =========================
    @PostMapping("/logout")
    public ApiResult<Void> logout(@RequestHeader("Authorization") String header) {

        if (header == null || !header.startsWith("Bearer ")) {
            throw new ApiException("Invalid Authorization header");
        }

        String token = header.substring(7);

        String email = jwtUtil.extractEmail(token);

        // blacklist access token (persisted with its expiry so purge job can clean it up)
        blacklistService.blacklistToken(token, jwtUtil.extractExpiry(token));

        // delete refresh token
        refreshTokenService.deleteByEmail(email);

        return ApiResult.<Void>builder()
                .success(true)
                .message("Logged out successfully")
                .data(null)
                .build();
    }

    // =========================
    // ✅ REFRESH TOKEN (FINAL 🔥)
    // =========================
    @PostMapping("/refresh")
    public ApiResult<String> refresh(@RequestBody Map<String, String> request) {

        String refreshToken = request.get("refreshToken");

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException("Refresh token is required");
        }

        RefreshToken token = refreshTokenService.validateRefreshToken(refreshToken);

        User user = userService.findByEmail(token.getEmail());

        // FIX H-5: emit the same "ROLE_"-prefixed claim that login produces, so the
        // role claim is consistent across login and refresh (was bare enum name here).
        String role = "ROLE_" + (user.getRole() != null ? user.getRole().name() : "USER");

        String newAccessToken = jwtUtil.generateToken(
                user.getEmail(),
                role
        );

        return ApiResult.<String>builder()
                .success(true)
                .message("New access token generated")
                .data(newAccessToken)
                .build();
    }

    // =========================
    // ✅ VERIFY EMAIL (PHASE 3)
    // =========================
    @PostMapping("/verify-email")
    public ApiResult<String> verifyEmail(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            throw new ApiException("Verification token is required");
        }
        String msg = userService.verifyEmail(token);
        return ApiResult.<String>builder().success(true).message(msg).data(null).build();
    }

    // =========================
    // ✅ RESEND VERIFICATION (PHASE 3)
    // =========================
    @PostMapping("/resend-verification")
    public ApiResult<String> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            throw new ApiException("Email is required");
        }
        String msg = userService.resendVerification(email);
        return ApiResult.<String>builder().success(true).message(msg).data(null).build();
    }

    // =========================
    // ✅ FORGOT PASSWORD (PHASE 3)
    // =========================
    @PostMapping("/forgot-password")
    public ApiResult<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String msg = userService.forgotPassword(request.getEmail());
        return ApiResult.<String>builder().success(true).message(msg).data(null).build();
    }

    // =========================
    // ✅ RESET PASSWORD (PHASE 3)
    // =========================
    @PostMapping("/reset-password")
    public ApiResult<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String msg = userService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResult.<String>builder().success(true).message(msg).data(null).build();
    }
}
