package com.truelens.backend.security;

import com.truelens.backend.model.RefreshToken;
import com.truelens.backend.repository.RefreshTokenRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class RefreshTokenService {

    private final RefreshTokenRepository repository;

    public RefreshTokenService(RefreshTokenRepository repository) {
        this.repository = repository;
    }

    // ✅ Create new refresh token
    // FIX #17: Removed @SuppressWarnings("null"). The warning was triggered because
    // some IDE/tooling marks JpaRepository.save() as potentially null-returning.
    // In practice, save() on a new (non-null) entity always returns the saved entity.
    // The input `email` is guaranteed non-null by all callers (JWT-authenticated).
    public RefreshToken createToken(String email) {

        repository.deleteByEmail(email);

        RefreshToken token = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .email(email)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();

        return repository.save(token);
    }

    // ✅ Validate refresh token
    public RefreshToken validateRefreshToken(String token) {

        RefreshToken refreshToken = repository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            repository.delete(refreshToken);
            throw new RuntimeException("Refresh token expired");
        }

        return refreshToken;
    }

    // ✅ Delete tokens for logout
    public void deleteByEmail(String email) {
        repository.deleteByEmail(email);
    }
}