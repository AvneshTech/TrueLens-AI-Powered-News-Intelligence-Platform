package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * PHASE 2: migrated to MongoDB @Document.
 * - id → String; userId → String (references User.id, now a String).
 * - userId and createdAt indexed (audit M-5) — they drive every analytics query
 *   and the per-user history fetch.
 * - result enum is stored as its name string by the Mongo enum converter.
 */
@Document(collection = "prediction_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionHistory {

    @Id
    private String id;

    private String newsTitle;

    private String content;

    private PredictionResult result;

    private double confidence;

    @Indexed
    @CreatedDate
    private LocalDateTime createdAt;

    @Indexed
    private String userId;

    private String category;
}
