package com.truelens.backend.controller;

import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.dto.PublicNoteResponse;
import com.truelens.backend.service.NoteService;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * PHASE 7: deliberately unauthenticated — this is the endpoint behind a note's
 * public share link, so by definition it must be reachable without a TrueLens
 * account. Permitted in SecurityConfig under "/api/public/**".
 *
 * Returns {@link PublicNoteResponse}, a narrower type than the owner-facing
 * NoteResponse, so nothing internal (note id, owner email, share-management
 * fields) is ever exposed to a public viewer.
 */
@RestController
@RequestMapping("/api/public/notes")
@Tag(name = "Public Notes", description = "Unauthenticated access to shared notes")
public class PublicNoteController {

    private final NoteService noteService;

    public PublicNoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping("/{shareToken}")
    public ApiResult<PublicNoteResponse> getSharedNote(@PathVariable String shareToken) {
        return ApiResult.success(
                noteService.getPublicNote(shareToken),
                "Note retrieved successfully");
    }
}
