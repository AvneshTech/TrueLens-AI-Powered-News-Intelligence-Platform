package com.truelens.backend.service;

import com.truelens.backend.dto.NoteRequest;
import com.truelens.backend.dto.NoteResponse;
import com.truelens.backend.model.Note;
import com.truelens.backend.model.User;
import com.truelens.backend.repository.NoteRepository;
import com.truelens.backend.repository.UserRepository;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class NoteService {

    private static final Logger logger = LoggerFactory.getLogger(NoteService.class);

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    public NoteService(NoteRepository noteRepository, UserRepository userRepository) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
    }

    // FIX #17: Removed @SuppressWarnings("null") — addressed the underlying issue instead.
    // Also replaced System.out.println / e.printStackTrace() with proper logger calls (Fix #17 bonus).
    public NoteResponse createNote(NoteRequest request, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Note note = Note.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .tags(request.getTags())
                .user(user)
                .build();

        try {
            Note savedNote = noteRepository.save(note);
            return mapToResponse(savedNote);
        } catch (Exception e) {
            logger.error("Failed to save note for user {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to save note");
        }
    }

    // ✅ GET NOTES (PAGINATED)
    public Page<NoteResponse> getUserNotes(String email, Pageable pageable) {
        return noteRepository.findByUserEmail(email, pageable)
                .map(this::mapToResponse);
    }

    // ✅ GET SINGLE NOTE (SECURE)
    public NoteResponse getNoteById(Long id, String email) {

        Note note = noteRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        return mapToResponse(note);
    }

    // ✅ UPDATE NOTE (SECURE)
    public NoteResponse updateNote(Long id, NoteRequest request, String email) {

        Note note = noteRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        note.setTitle(request.getTitle());
        note.setContent(request.getContent());
        note.setCategory(request.getCategory());
        note.setTags(request.getTags());

        Note updated = noteRepository.save(note);

        return mapToResponse(updated);
    }

    // ✅ DELETE NOTE (SECURE)
    // FIX #17: Removed @SuppressWarnings("null") — noteRepository.delete(note)
    // accepts a non-null entity which we guarantee via the orElseThrow above.
    public void deleteNote(Long id, String email) {

        Note note = noteRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        noteRepository.delete(note);
    }

    // ✅ SEARCH NOTES
    public Page<NoteResponse> searchNotes(String email, String keyword, Pageable pageable) {

        if (keyword == null || keyword.trim().isEmpty()) {
            return getUserNotes(email, pageable);
        }

        return noteRepository
                .findByUserEmailAndTitleContainingIgnoreCase(email, keyword, pageable)
                .map(this::mapToResponse);
    }

    // ✅ MAPPER
    private NoteResponse mapToResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .category(note.getCategory())
                .tags(note.getTags())
                .createdAt(note.getCreatedAt())
                .build();
    }
}