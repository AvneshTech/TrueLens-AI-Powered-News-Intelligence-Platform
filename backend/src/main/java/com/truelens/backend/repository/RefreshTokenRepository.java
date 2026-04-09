package com.truelens.backend.repository;

import com.truelens.backend.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByEmail(String email);

    void deleteByToken(String token);   // ONLY DECLARE — no body
}
