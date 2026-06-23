package com.truelens.backend.service.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * PHASE 5: resolves the configured {@link ChatProvider} by {@code app.chat.provider}
 * and falls back to {@code app.chat.fallback-provider} (default: huggingface) if the
 * primary call fails — so a transient Anthropic outage or quota issue degrades the
 * chat to a working-but-weaker assistant instead of a hard error.
 */
@Component
public class ChatProviderRegistry {

    private static final Logger log = LoggerFactory.getLogger(ChatProviderRegistry.class);

    private final Map<String, ChatProvider> providers;

    @Value("${app.chat.provider:anthropic}")
    private String primaryId;

    @Value("${app.chat.fallback-provider:huggingface}")
    private String fallbackId;

    public ChatProviderRegistry(List<ChatProvider> providerList) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(ChatProvider::id, p -> p));
    }

    /**
     * Streams a completion using the primary provider, transparently retrying once
     * against the fallback provider on failure. {@code onToken} may therefore be
     * invoked from either provider — callers don't need to know which one served
     * the request.
     */
    public String streamCompletion(String systemPrompt, List<ChatTurn> turns, Consumer<String> onToken)
            throws ChatProviderException {

        ChatProvider primary = providers.get(primaryId);
        if (primary == null) {
            throw new ChatProviderException("Unknown chat provider configured: " + primaryId);
        }

        // Track whether any token already reached the client before a failure — if so,
        // retrying on the fallback would duplicate/garble what the user already saw,
        // so we only fall back on a clean (zero-token) failure.
        boolean[] emittedAny = {false};
        Consumer<String> trackingOnToken = chunk -> {
            emittedAny[0] = true;
            onToken.accept(chunk);
        };

        try {
            return primary.streamCompletion(systemPrompt, turns, trackingOnToken);
        } catch (ChatProviderException primaryFailure) {
            log.warn("Primary chat provider '{}' failed: {}", primaryId, primaryFailure.getMessage());

            if (emittedAny[0]) {
                throw primaryFailure; // partial output already streamed — don't retry
            }

            ChatProvider fallback = providers.get(fallbackId);
            if (fallback == null || fallback.id().equals(primaryId)) {
                throw primaryFailure;
            }

            log.info("Falling back to chat provider '{}'", fallbackId);
            return fallback.streamCompletion(systemPrompt, turns, onToken);
        }
    }
}
