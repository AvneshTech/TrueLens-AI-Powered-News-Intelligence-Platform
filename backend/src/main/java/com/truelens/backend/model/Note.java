package com.truelens.backend.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

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

    // FIX M-8: was a single comma-separated String while the frontend treated tags
    // as string[] in places — a type mismatch that made serialization ambiguous.
    // Modeled properly as a list now, on both the Java and TypeScript sides.
    private List<String> tags;

    // Denormalised owner reference (replaces the @ManyToOne User relation).
    @Indexed
    private String userEmail;

    // ─── PHASE 7: sharing ───────────────────────────────────────────────────
    // Random, unguessable token used in the public share URL (/notes/shared/{token}).
    // Sparse-indexed since most notes are never shared and will have a null token —
    // a normal unique index would reject the second null insert.
    @Indexed(unique = true, sparse = true)
    private String shareToken;

    // Revoking a share clears shareToken entirely (not just this flag) — see
    // NoteService.unshareNote(). If revoke only flipped this flag and kept the same
    // token, re-sharing later would silently reactivate that same link for anyone who
    // still had it saved from before the revoke, defeating the point of revoking.
    //
    // Named "shared" rather than "isPublic" deliberately: Jackson derives a boolean's
    // JSON property name by stripping a leading "is" from the getter. A field already
    // named isPublic gets getter isPublic() -> Jackson strips "is" -> JSON key ends up
    // "public", not "isPublic", silently breaking any client expecting the latter.
    // "shared" -> getter isShared() -> stripped property name "shared" — no mismatch.
    @Builder.Default
    private boolean shared = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
