package com.truelens.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response returned by note-related endpoints.
 * ✅ FIX: Added missing `category` and `tags` fields.
 *    NoteService.mapToResponse() calls .category() and .tags() on the builder —
 *    both were missing from this DTO causing compile errors.
 */
@Data
@Builder
@Schema(name = "NoteResponse", description = "Response containing note details")
public class NoteResponse {

    private String id;
    private String title;
    private String content;

    // ✅ ADDED: matches Note model field
    private String category;

    // FIX M-8: List<String>, matching the Note model and frontend usage.
    private List<String> tags;

    private String userEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // PHASE 7: only meaningful to the owner viewing their own note list/detail —
    // PublicNoteController returns a separate, narrower DTO that never includes these.
    // Named "shared" (not "isPublic") to avoid Jackson's is-prefix stripping on
    // serialization — see the comment on Note.shared for the full explanation.
    private boolean shared;
    private String shareToken;
}