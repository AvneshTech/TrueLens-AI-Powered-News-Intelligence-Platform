package com.truelens.backend.controller;

import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.dto.NoteRequest;
import com.truelens.backend.dto.NoteResponse;
import com.truelens.backend.service.NoteService;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/notes")
@Tag(name = "Notes", description = "Note management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    // ✅ CREATE NOTE
    @PostMapping
    public ApiResult<NoteResponse> createNote(
            @RequestBody @Valid NoteRequest request,
            Authentication auth) {

        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }

        NoteResponse resp = noteService.createNote(request, auth.getName());
        return ApiResult.success(resp, "Note created successfully");
    }

    // ✅ GET NOTES
    @GetMapping
    public ApiResult<List<NoteResponse>> getMyNotes(
            Authentication auth,
            Pageable pageable) {

        List<NoteResponse> notes = noteService.getUserNotes(auth.getName(), pageable).getContent();
        return ApiResult.success(notes, "Notes retrieved successfully");
    }

    // ✅ GET SINGLE NOTE
    @GetMapping("/{id}")
    public ApiResult<NoteResponse> getNote(
            @PathVariable Long id,
            Authentication auth) {

        return ApiResult.success(
                noteService.getNoteById(id, auth.getName()),
                "Note retrieved successfully");
    }

    // ✅ UPDATE NOTE
    @PutMapping("/{id}")
    public ApiResult<NoteResponse> updateNote(
            @PathVariable Long id,
            @RequestBody @Valid NoteRequest request,
            Authentication auth) {

        return ApiResult.success(
                noteService.updateNote(id, request, auth.getName()),
                "Note updated successfully");
    }

    // ✅ DELETE NOTE
    @DeleteMapping("/{id}")
    public ApiResult<Void> deleteNote(
            @PathVariable Long id,
            Authentication auth) {

        noteService.deleteNote(id, auth.getName());
        return ApiResult.success(null, "Note deleted successfully");
    }

    // ✅ SEARCH NOTES
    @GetMapping("/search")
    public ApiResult<List<NoteResponse>> searchNotes(
            @RequestParam(required = false) String keyword,
            Pageable pageable,
            Authentication auth) {

        List<NoteResponse> notes = noteService.searchNotes(auth.getName(), keyword, pageable).getContent();
        return ApiResult.success(notes, "Notes retrieved successfully");
    }

    // ✅ FIX: REMOVED the incorrectly nested AnalyticsController inner class.
    // It conflicted with the standalone AnalyticsController.java causing a
    // Spring duplicate bean mapping error at startup.
    // The real AnalyticsController is in AnalyticsController.java.
}
