package com.truelens.backend.controller;

import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.dto.ChatStreamRequest;
import com.truelens.backend.service.ConversationService;
import com.truelens.backend.service.chat.ChatProviderException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.Executor;

/**
 * PHASE 5: AI assistant endpoints.
 *
 * - POST /api/chat         legacy, non-streaming, single-shot completion. Kept for
 *                           internal callers (e.g. apiService.categorizeNews) that just
 *                           want a plain string back and don't need persisted history.
 * - POST /api/chat/stream   the real chat UI: persists the turn, streams the reply
 *                           token-by-token over SSE, persists the assistant's reply.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Chat", description = "AI assistant endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private static final String LEGACY_SYSTEM_PROMPT =
            "You are a helpful assistant. Respond concisely and directly to the request.";

    private final ConversationService conversationService;
    private final Executor chatStreamingExecutor;

    public ChatController(ConversationService conversationService, Executor chatStreamingExecutor) {
        this.conversationService = conversationService;
        this.chatStreamingExecutor = chatStreamingExecutor;
    }

    @PostMapping("/chat")
    public ApiResult<Map<String, String>> chat(@RequestBody Map<String, String> body) {
        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ApiResult.error("Message cannot be empty");
        }

        try {
            String response = conversationService.completeOnce(LEGACY_SYSTEM_PROMPT, message);
            return ApiResult.success(Map.of("message", response), "OK");
        } catch (ChatProviderException e) {
            log.warn("Legacy /api/chat completion failed: {}", e.getMessage());
            return ApiResult.error("AI assistant is temporarily unavailable");
        }
    }

    /**
     * SSE stream. The body is read and validated synchronously (so a bad request fails
     * fast with a normal HTTP error), then the actual provider call runs on
     * {@code chatStreamingExecutor} so the Tomcat request thread isn't held for the
     * full duration of the reply.
     */
    @PostMapping(value = "/chat/stream", produces = "text/event-stream")
    public SseEmitter streamChat(@RequestBody @Valid ChatStreamRequest request, Authentication auth) {
        SseEmitter emitter = new SseEmitter(120_000L); // 2-minute ceiling on a single reply
        String userEmail = auth.getName();

        chatStreamingExecutor.execute(() -> {
            try {
                conversationService.sendMessage(
                        request.getConversationId(),
                        userEmail,
                        request.getMessage(),
                        chunk -> sendEvent(emitter, "token", chunk),
                        newConversationId -> sendEvent(emitter, "conversation", newConversationId)
                );
                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (ChatProviderException e) {
                log.warn("Chat stream failed for {}: {}", userEmail, e.getMessage());
                sendEvent(emitter, "error", "The AI assistant is temporarily unavailable. Please try again.");
                emitter.complete();
            } catch (Exception e) {
                log.error("Unexpected error during chat stream for {}", userEmail, e);
                sendEvent(emitter, "error", "Something went wrong. Please try again.");
                emitter.complete();
            }
        });

        return emitter;
    }

    private void sendEvent(SseEmitter emitter, String name, String data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (Exception e) {
            // The client likely disconnected — nothing more we can do for this emitter.
            log.debug("Failed to emit SSE event '{}': {}", name, e.getMessage());
        }
    }
}
