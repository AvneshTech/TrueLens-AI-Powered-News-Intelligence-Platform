package com.truelens.backend.repository;

import com.truelens.backend.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    /** Most recent N turns, oldest-first once reversed by the caller — used for context windowing. */
    List<Message> findTop20ByConversationIdOrderByCreatedAtDesc(String conversationId);

    void deleteByConversationId(String conversationId);

    long countByConversationId(String conversationId);
}
