package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * PHASE 2: migrated to MongoDB @Document. token (unique) and email are indexed.
 */
@Document(collection = "refresh_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    @Indexed
    private String email;

    private LocalDateTime expiryDate;

    @CreatedDate
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return expiryDate.isBefore(LocalDateTime.now());
    }
}
