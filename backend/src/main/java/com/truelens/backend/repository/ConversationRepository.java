package com.truelens.backend.repository;

import com.truelens.backend.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends MongoRepository<Conversation, String> {

    List<Conversation> findByUserEmailOrderByUpdatedAtDesc(String userEmail);

    Optional<Conversation> findByIdAndUserEmail(String id, String userEmail);

    void deleteByIdAndUserEmail(String id, String userEmail);

    long countByUserEmail(String userEmail);
}
