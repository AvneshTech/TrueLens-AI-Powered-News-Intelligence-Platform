package com.truelens.backend.service.chat;

import com.truelens.backend.service.HuggingFaceService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Consumer;

/**
 * PHASE 5: legacy fallback provider — wraps the original {@link HuggingFaceService}
 * (used before the provider-agnostic rewrite) behind the same {@link ChatProvider}
 * contract. The HF inference API used here doesn't support token streaming, so the
 * full response is delivered as a single chunk through {@code onToken} — callers
 * (the SSE endpoint, {@code categorizeNews}) work identically either way.
 *
 * Kept so {@code app.chat.provider=huggingface} still works without an Anthropic key,
 * and as a safety net if the Anthropic call fails.
 */
@Component
public class HuggingFaceChatProvider implements ChatProvider {

    private final HuggingFaceService huggingFaceService;

    public HuggingFaceChatProvider(HuggingFaceService huggingFaceService) {
        this.huggingFaceService = huggingFaceService;
    }

    @Override
    public String id() {
        return "huggingface";
    }

    @Override
    public String streamCompletion(String systemPrompt, List<ChatTurn> turns, Consumer<String> onToken)
            throws ChatProviderException {

        if (turns.isEmpty()) {
            throw new ChatProviderException("No user message to send");
        }

        // The HF chat model used here has no native multi-turn/system-prompt support —
        // flatten the recent context into a single prompt so at least short-term
        // continuity is preserved.
        StringBuilder prompt = new StringBuilder();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            prompt.append(systemPrompt).append("\n\n");
        }
        for (ChatTurn turn : turns) {
            prompt.append(turn.role().equals("user") ? "User: " : "Assistant: ")
                    .append(turn.content()).append("\n");
        }

        String response = huggingFaceService.getResponse(prompt.toString());
        if (response == null || response.isBlank()) {
            throw new ChatProviderException("Hugging Face returned an empty response");
        }
        // HuggingFaceService reports failures as plain strings ("HF Error: ...",
        // "Error: ...") rather than throwing — translate those back into exceptions
        // so the registry doesn't surface an error message as if it were a real reply.
        if (response.startsWith("HF Error:") || response.startsWith("Error:")) {
            throw new ChatProviderException(response);
        }

        onToken.accept(response);
        return response;
    }
}
