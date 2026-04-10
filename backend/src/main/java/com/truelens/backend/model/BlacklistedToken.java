package com.truelens.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Persisted JWT blacklist entry.
 * Created as part of Fix #1 (replace in-memory token blacklist).
 */
@Entity
@Table(name = "blacklisted_tokens", indexes = {
    @Index(name = "idx_blacklisted_token", columnList = "token", unique = true)
})
public class BlacklistedToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    public BlacklistedToken() {}

    public BlacklistedToken(String token, LocalDateTime expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
}
