package com.truelens.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PHASE 7: response for GET /api/public/notes/{token} — the unauthenticated, public
 * view of a shared note.
 *
 * Deliberately a separate, narrower type from {@link NoteResponse} rather than reusing
 * it: this is rendered to anyone with the link, so it must never include {@code id}
 * (would let someone probe /api/notes/{id} directly), {@code userEmail} (leaks the
 * owner's address), or {@code shareToken}/{@code isPublic} (no reason for a viewer to
 * see the management fields).
 */
@Data
@Builder
@Schema(name = "PublicNoteResponse", description = "Read-only public view of a shared note")
public class PublicNoteResponse {

    private String title;
    private String content;
    private String category;
    private List<String> tags;
    private LocalDateTime createdAt;
}
