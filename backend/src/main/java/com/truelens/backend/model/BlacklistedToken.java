package com.truelens.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Persisted JWT blacklist entry.
 *
 * PHASE 2: migrated to MongoDB @Document. The `expiresAt` field carries a TTL index
 * (expireAfterSeconds = 0) so MongoDB removes each entry automatically once it passes
 * its expiry — replacing the need for a scheduled purge job (the hourly sweep is kept
 * only as a belt-and-suspenders fallback).
 */
@Document(collection = "blacklisted_tokens")
public class BlacklistedToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    @Indexed(expireAfterSeconds = 0)
    private LocalDateTime expiresAt;

    public BlacklistedToken() {}

    public BlacklistedToken(String token, LocalDateTime expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public String getId() { return id; }
    public String getToken() { return token; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
}
