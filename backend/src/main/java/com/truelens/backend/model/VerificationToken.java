package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * PHASE 3: single-use, expiring token for email verification and password reset.
 * A TTL index on expiresAt lets MongoDB auto-remove stale tokens.
 */
@Document(collection = "verification_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    @Indexed
    private String email;

    private TokenType type;

    @Indexed(expireAfterSeconds = 0)
    private LocalDateTime expiresAt;

    private boolean used;

    @CreatedDate
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return expiresAt == null || expiresAt.isBefore(LocalDateTime.now());
    }
}
