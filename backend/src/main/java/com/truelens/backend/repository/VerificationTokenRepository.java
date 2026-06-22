package com.truelens.backend.repository;

import com.truelens.backend.model.TokenType;
import com.truelens.backend.model.VerificationToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VerificationTokenRepository extends MongoRepository<VerificationToken, String> {

    Optional<VerificationToken> findByToken(String token);

    void deleteByEmailAndType(String email, TokenType type);
}
