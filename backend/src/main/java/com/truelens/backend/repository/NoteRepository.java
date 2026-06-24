package com.truelens.backend.repository;

import com.truelens.backend.model.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface NoteRepository extends MongoRepository<Note, String> {

    Page<Note> findByUserEmail(String email, Pageable pageable);

    Optional<Note> findByIdAndUserEmail(String id, String email);

    Page<Note> findByUserEmailAndTitleContainingIgnoreCase(
            String email,
            String title,
            Pageable pageable
    );

    long countByUserEmail(String email);

    // PHASE 7: looked up by the public share endpoint — also requires shared=true so
    // a revoked share (token still set, shared flipped false) correctly 404s instead
    // of remaining accessible until the token itself is cleared.
    Optional<Note> findByShareTokenAndSharedTrue(String shareToken);
}
