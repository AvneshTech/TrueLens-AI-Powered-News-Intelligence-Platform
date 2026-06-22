package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * PHASE 2: migrated from JPA @Entity to MongoDB @Document.
 *
 * MongoDB has no joins, so the previous @ManyToOne User relation is replaced by a
 * denormalised, indexed `userEmail` reference — which is exactly what every
 * existing query (findByUserEmail / findByIdAndUserEmail / countByUserEmail) used.
 * Timestamps are handled by Mongo auditing instead of @PrePersist/@PreUpdate.
 */
@Document(collection = "notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Note {

    @Id
    private String id;

    private String title;

    private String content;

    private String category;

    // Kept as a String to preserve the existing API contract (see audit M-8 for the
    // recommended List<String> change — deferred to the Notes module phase).
    private String tags;

    // Denormalised owner reference (replaces the @ManyToOne User relation).
    @Indexed
    private String userEmail;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
