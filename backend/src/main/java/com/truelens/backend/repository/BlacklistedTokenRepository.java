package com.truelens.backend.repository;

import com.truelens.backend.model.BlacklistedToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, Long> {

    boolean existsByToken(String token);

    void deleteAllByExpiresAtBefore(LocalDateTime cutoff);
}
