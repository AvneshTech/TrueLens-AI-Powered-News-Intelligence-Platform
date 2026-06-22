package com.truelens.backend.repository;

import com.truelens.backend.model.RefreshToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RefreshTokenRepository
        extends MongoRepository<RefreshToken, String> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByEmail(String email);

    void deleteByToken(String token);
}
