package com.truelens.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

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

    private Long id;
    private String title;
    private String content;

    // ✅ ADDED: matches Note model field
    private String category;

    // ✅ ADDED: matches Note model field
    private String tags;

    private String userEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}