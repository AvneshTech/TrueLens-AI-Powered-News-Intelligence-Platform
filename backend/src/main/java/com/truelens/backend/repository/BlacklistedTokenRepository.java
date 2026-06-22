package com.truelens.backend.repository;

import com.truelens.backend.model.BlacklistedToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;

public interface BlacklistedTokenRepository extends MongoRepository<BlacklistedToken, String> {

    boolean existsByToken(String token);

    void deleteAllByExpiresAtBefore(LocalDateTime cutoff);
}
