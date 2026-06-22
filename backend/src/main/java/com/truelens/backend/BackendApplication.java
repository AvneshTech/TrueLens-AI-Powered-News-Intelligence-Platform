package com.truelens.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * PHASE 2:
 * - @EnableMongoAuditing populates @CreatedDate / @LastModifiedDate (replaces the
 *   JPA @PrePersist / @PreUpdate hooks that no longer fire under MongoDB).
 * - @EnableScheduling activates the hourly blacklist sweep (the Mongo TTL index on
 *   BlacklistedToken.expiresAt is the primary cleanup; the sweep is a fallback).
 */
@SpringBootApplication
@EnableMongoAuditing
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
