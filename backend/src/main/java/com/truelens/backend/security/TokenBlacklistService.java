package com.truelens.backend.security;

import com.truelens.backend.model.BlacklistedToken;
import com.truelens.backend.repository.BlacklistedTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * FIX #1: Replaced volatile in-memory HashSet with a database-backed blacklist.
 *
 * Previous problem: tokens were stored in a plain HashSet, meaning:
 *  - All blacklisted tokens were lost on every app restart.
 *  - In multi-instance deployments, each server had its own separate set,
 *    so a logout on one instance had no effect on others.
 *
 * Fix: every blacklisted token is persisted to the `blacklisted_tokens` table
 * with its expiry timestamp. A scheduled job cleans up expired entries hourly
 * so the table does not grow unboundedly.
 */
@Service
public class TokenBlacklistService {

    private final BlacklistedTokenRepository repository;

    public TokenBlacklistService(BlacklistedTokenRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void blacklistToken(String token, LocalDateTime expiresAt) {
        if (!repository.existsByToken(token)) {
            repository.save(new BlacklistedToken(token, expiresAt));
        }
    }

    public boolean isBlacklisted(String token) {
        return repository.existsByToken(token);
    }

    /** Remove expired tokens every hour to keep the table lean. */
    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void purgeExpiredTokens() {
        repository.deleteAllByExpiresAtBefore(LocalDateTime.now());
    }
}
