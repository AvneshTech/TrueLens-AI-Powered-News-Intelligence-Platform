package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * PHASE 5: a persisted chat conversation (one thread of messages) owned by a user.
 *
 * The conversation itself stores only metadata; turns live in {@link Message},
 * keyed by conversationId, so the message list can grow without rewriting the
 * parent document on every turn.
 */
@Document(collection = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    private String id;

    @Indexed
    private String userEmail;

    /** Short auto-generated label (e.g. first ~6 words of the first user message). */
    private String title;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
