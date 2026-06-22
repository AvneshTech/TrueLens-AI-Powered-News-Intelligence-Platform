package com.truelens.backend.repository;

import com.truelens.backend.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findTop50ByUserEmailOrderByCreatedAtDesc(String userEmail);

    long countByUserEmailAndReadFalse(String userEmail);

    Optional<Notification> findByIdAndUserEmail(String id, String userEmail);

    void deleteByIdAndUserEmail(String id, String userEmail);
}
