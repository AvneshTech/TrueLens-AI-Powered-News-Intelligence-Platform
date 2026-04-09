package com.truelens.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request payload for creating or updating a note.
 * ✅ FIX: Added missing `category` and `tags` fields.
 *    NoteService calls request.getCategory() and request.getTags() —
 *    both were missing from this DTO causing compile errors.
 */
@Data
@Schema(name = "NoteRequest", description = "Payload to create or update a note")
public class NoteRequest {

    @NotBlank(message = "Title cannot be blank")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    @Schema(description = "Title of the note", example = "My Daily Plan")
    private String title;

    @NotBlank(message = "Content cannot be blank")
    @Size(max = 1000, message = "Content must not exceed 1000 characters")
    @Schema(description = "Content of the note", example = "Today I will learn Spring Boot...")
    private String content;

    // ✅ ADDED: matches Note model field
    @Schema(description = "Category of the note", example = "Work")
    private String category;

    // ✅ ADDED: matches Note model field (stored as comma-separated string)
    @Schema(description = "Tags for the note", example = "java,spring,todo")
    private String tags;

    // Optional helpers
    public String getTitleTrimmed() {
        return title != null ? title.trim() : null;
    }

    public String getContentTrimmed() {
        return content != null ? content.trim() : null;
    }
}