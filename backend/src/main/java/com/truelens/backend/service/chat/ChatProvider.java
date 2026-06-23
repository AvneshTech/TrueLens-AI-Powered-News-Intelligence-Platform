package com.truelens.backend.service.chat;

import java.util.List;
import java.util.function.Consumer;

/**
 * PHASE 5: provider-agnostic chat abstraction.
 *
 * Swapping the underlying LLM (Anthropic, OpenAI, the legacy Hugging Face proxy, …)
 * is a matter of adding a new implementation and pointing {@code app.chat.provider}
 * at its {@link #id()} — no controller/service/frontend changes required.
 */
public interface ChatProvider {

    /** Short, lowercase identifier matched against the {@code app.chat.provider} property. */
    String id();

    /**
     * Streams a completion for the given conversation turns.
     *
     * @param systemPrompt static instructions prepended ahead of the conversation
     * @param turns        the context-windowed conversation so far, oldest-first,
     *                     ending with the new user turn
     * @param onToken      invoked with each incremental text chunk as it arrives
     * @return the full, concatenated assistant response (also useful for callers
     *         that don't care about incremental tokens, e.g. {@code categorizeNews}).
     * @throws ChatProviderException on any upstream failure (auth, network, rate limit, …)
     */
    String streamCompletion(String systemPrompt, List<ChatTurn> turns, Consumer<String> onToken)
            throws ChatProviderException;
}
