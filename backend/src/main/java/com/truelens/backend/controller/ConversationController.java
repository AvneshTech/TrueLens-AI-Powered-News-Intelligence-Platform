package com.truelens.backend.controller;

import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.dto.ConversationResponse;
import com.truelens.backend.dto.MessageResponse;
import com.truelens.backend.model.Conversation;
import com.truelens.backend.model.Message;
import com.truelens.backend.service.ConversationService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * PHASE 5: persisted chat history — list/create/rename/delete conversations and
 * read their messages. The streaming send endpoint lives in {@link ChatController}.
 */
@RestController
@RequestMapping("/api/conversations")
@Tag(name = "Chat", description = "Persisted AI assistant conversations")
@SecurityRequirement(name = "Bearer Authentication")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ApiResult<List<ConversationResponse>> listConversations(Authentication auth) {
        List<ConversationResponse> conversations = conversationService
                .listConversations(auth.getName())
                .stream()
                .map(this::toResponse)
                .toList();
        return ApiResult.success(conversations, "Conversations retrieved successfully");
    }

    @PostMapping
    public ApiResult<ConversationResponse> createConversation(Authentication auth) {
        Conversation conversation = conversationService.createConversation(auth.getName());
        return ApiResult.success(toResponse(conversation), "Conversation created successfully");
    }

    @GetMapping("/{id}/messages")
    public ApiResult<List<MessageResponse>> getMessages(
            @PathVariable String id,
            Authentication auth) {
        List<MessageResponse> messages = conversationService
                .getMessages(id, auth.getName())
                .stream()
                .map(this::toResponse)
                .toList();
        return ApiResult.success(messages, "Messages retrieved successfully");
    }

    @PutMapping("/{id}")
    public ApiResult<ConversationResponse> renameConversation(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String title = body.getOrDefault("title", "").trim();
        if (title.isEmpty()) {
            return ApiResult.error("Title cannot be blank");
        }
        Conversation conversation = conversationService.renameConversation(id, auth.getName(), title);
        return ApiResult.success(toResponse(conversation), "Conversation renamed successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResult<Void> deleteConversation(
            @PathVariable String id,
            Authentication auth) {
        conversationService.deleteConversation(id, auth.getName());
        return ApiResult.success(null, "Conversation deleted successfully");
    }

    private ConversationResponse toResponse(Conversation c) {
        return ConversationResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private MessageResponse toResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .role(m.getRole().name().toLowerCase())
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
