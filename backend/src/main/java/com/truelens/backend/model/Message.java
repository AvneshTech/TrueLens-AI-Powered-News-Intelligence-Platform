package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * PHASE 5: a single turn in a {@link Conversation}.
 */
@Document(collection = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    private String id;

    @Indexed
    private String conversationId;

    /** Defensive copy of the owner — lets us scope/delete without a join. */
    @Indexed
    private String userEmail;

    private MessageRole role;

    private String content;

    @CreatedDate
    private LocalDateTime createdAt;
}
