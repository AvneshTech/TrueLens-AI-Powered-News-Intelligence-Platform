package com.truelens.backend.repository;

import com.truelens.backend.model.User;
import com.truelens.backend.model.Role;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    // find user by email (login)
    Optional<User> findByEmail(String email);

    // check if email exists
    boolean existsByEmail(String email);

    // find users by role (admin filtering)
    List<User> findByRole(Role role);

    // count users (analytics)
    long count();

    // count banned users (analytics)
    long countByBannedTrue();

    

}