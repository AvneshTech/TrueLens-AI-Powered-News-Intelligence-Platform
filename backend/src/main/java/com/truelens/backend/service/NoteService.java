package com.truelens.backend.service;

import com.truelens.backend.dto.NoteRequest;
import com.truelens.backend.dto.NoteResponse;
import com.truelens.backend.dto.PublicNoteResponse;
import com.truelens.backend.exception.ApiException;
import com.truelens.backend.model.Note;
import com.truelens.backend.model.User;
import com.truelens.backend.repository.NoteRepository;
import com.truelens.backend.repository.UserRepository;
import com.truelens.backend.model.NotificationType;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;

@Service
public class NoteService {

    private static final Logger logger = LoggerFactory.getLogger(NoteService.class);

    // PHASE 7: 24 random bytes -> 32 url-safe base64 chars, no padding. Long enough
    // that brute-forcing a live share link is computationally infeasible, and
    // url-safe so it drops straight into a path segment with no encoding needed.
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public NoteService(NoteRepository noteRepository, UserRepository userRepository,
                       NotificationService notificationService) {
        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
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
                .userEmail(email)
                .build();

        try {
            Note savedNote = noteRepository.save(note);
            notificationService.create(email, "Note created",
                    "Your note \"" + savedNote.getTitle() + "\" was saved.",
                    NotificationType.NOTE, "/notes");
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
    public NoteResponse getNoteById(String id, String email) {

        Note note = noteRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        return mapToResponse(note);
    }

    // ✅ UPDATE NOTE (SECURE)
    public NoteResponse updateNote(String id, NoteRequest request, String email) {

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
    public void deleteNote(String id, String email) {

        Note note = noteRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        noteRepository.delete(note);
    }

    // ✅ ADMIN DELETE (FIX H-2): delete any note by id, regardless of owner.
    // Backs the previously-dead DELETE /api/admin/notes/{id} endpoint.
    public void adminDeleteNote(String id) {
        Note note = noteRepository.findById(id)
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

    // ─── PHASE 7: sharing ───────────────────────────────────────────────────

    /**
     * Generates (or returns the existing) share token and marks the note public.
     * Idempotent while already shared — calling this again on an already-public
     * note does NOT rotate the token, so an owner re-opening the share dialog
     * doesn't accidentally invalidate a link they already sent someone.
     */
    public NoteResponse shareNote(String id, String email) {
        Note note = noteRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        if (!note.isShared() || note.getShareToken() == null) {
            note.setShareToken(generateShareToken());
            note.setShared(true);
            note = noteRepository.save(note);
        }

        return mapToResponse(note);
    }

    /**
     * Revokes sharing. Clears the token entirely (not just the isPublic flag) so a
     * later re-share always mints a fresh link — see the comment on Note.shareToken
     * for why reusing the old token after a revoke would be unsafe.
     */
    public NoteResponse unshareNote(String id, String email) {
        Note note = noteRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        note.setShared(false);
        note.setShareToken(null);
        Note updated = noteRepository.save(note);

        return mapToResponse(updated);
    }

    /** Public, unauthenticated lookup by share token — used by PublicNoteController. */
    public PublicNoteResponse getPublicNote(String shareToken) {
        Note note = noteRepository.findByShareTokenAndSharedTrue(shareToken)
                .orElseThrow(() -> new ApiException(
                        "This share link is invalid or has been revoked", HttpStatus.NOT_FOUND));

        return PublicNoteResponse.builder()
                .title(note.getTitle())
                .content(note.getContent())
                .category(note.getCategory())
                .tags(note.getTags())
                .createdAt(note.getCreatedAt())
                .build();
    }

    private String generateShareToken() {
        byte[] bytes = new byte[24];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // ✅ MAPPER
    private NoteResponse mapToResponse(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .category(note.getCategory())
                .tags(note.getTags())
                .userEmail(note.getUserEmail())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .shared(note.isShared())
                .shareToken(note.getShareToken())
                .build();
    }
}
