package com.truelens.backend.repository;

import com.truelens.backend.model.User;
import com.truelens.backend.model.Role;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    long countByBannedTrue();
}
