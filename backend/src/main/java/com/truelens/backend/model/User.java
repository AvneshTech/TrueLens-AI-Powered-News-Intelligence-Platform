package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * PHASE 2: migrated from a JPA @Entity to a MongoDB @Document.
 * - Numeric IDENTITY id → String (Mongo ObjectId, serialized as a hex string).
 * - unique email enforced via a Mongo unique index (auto-index-creation enabled).
 * - createdAt populated by Mongo auditing (@CreatedDate + @EnableMongoAuditing)
 *   since JPA @PrePersist no longer fires.
 */
@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private Role role;

    // PHASE 3: account stays inactive until the email is verified (login is blocked).
    private boolean verified;

    @CreatedDate
    private LocalDateTime createdAt;

    private boolean banned;
}
