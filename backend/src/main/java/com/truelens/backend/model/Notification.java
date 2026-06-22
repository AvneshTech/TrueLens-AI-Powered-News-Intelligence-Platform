package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * PHASE 4: in-app notification. Keyed by the owner's email (matches Authentication#getName).
 */
@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userEmail;

    private String title;

    private String message;

    private NotificationType type;

    // Optional in-app deep link (e.g. "/predictions", "/notes").
    private String link;

    private boolean read;

    @Indexed
    @CreatedDate
    private LocalDateTime createdAt;
}
