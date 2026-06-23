package com.truelens.backend.service.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * PHASE 5: default chat provider — Anthropic's Messages API with native SSE streaming.
 *
 * Uses {@link HttpClient} (not the shared {@code RestTemplate} bean) because RestTemplate
 * buffers the entire response body before returning it; a streamed chat reply needs the
 * bytes as they arrive off the wire so they can be relayed to the browser token-by-token.
 */
@Component
public class AnthropicChatProvider implements ChatProvider {

    private static final Logger log = LoggerFactory.getLogger(AnthropicChatProvider.class);
    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    @Value("${anthropic.api.key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-4-6}")
    private String model;

    @Value("${anthropic.max-tokens:1024}")
    private int maxTokens;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String id() {
        return "anthropic";
    }

    @Override
    public String streamCompletion(String systemPrompt, List<ChatTurn> turns, Consumer<String> onToken)
            throws ChatProviderException {

        if (apiKey == null || apiKey.isBlank()) {
            throw new ChatProviderException("Anthropic API key is not configured (ANTHROPIC_API_KEY)");
        }

        String requestBody = buildRequestBody(systemPrompt, turns);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .timeout(Duration.ofSeconds(60))
                .header("x-api-key", apiKey)
                .header("anthropic-version", ANTHROPIC_VERSION)
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        StringBuilder fullText = new StringBuilder();

        try {
            HttpResponse<InputStream> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() != 200) {
                String errorBody = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
                log.warn("Anthropic API error {}: {}", response.statusCode(), errorBody);
                throw new ChatProviderException(
                        "Anthropic API returned status " + response.statusCode());
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {

                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.startsWith("data:")) {
                        continue; // skip "event:" lines, blank lines, comments
                    }
                    String data = line.substring(5).trim();
                    if (data.isEmpty() || data.equals("[DONE]")) {
                        continue;
                    }

                    JsonNode event = mapper.readTree(data);
                    String type = event.path("type").asText();

                    if ("content_block_delta".equals(type)) {
                        JsonNode delta = event.path("delta");
                        if ("text_delta".equals(delta.path("type").asText())) {
                            String chunk = delta.path("text").asText("");
                            if (!chunk.isEmpty()) {
                                fullText.append(chunk);
                                onToken.accept(chunk);
                            }
                        }
                    } else if ("error".equals(type)) {
                        String msg = event.path("error").path("message").asText("Unknown Anthropic error");
                        throw new ChatProviderException("Anthropic stream error: " + msg);
                    }
                    // "message_start", "content_block_start/stop", "message_delta",
                    // "message_stop", and ping events carry no text — ignored.
                }
            }

        } catch (ChatProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new ChatProviderException("Failed to stream from Anthropic: " + e.getMessage(), e);
        }

        if (fullText.length() == 0) {
            throw new ChatProviderException("Anthropic returned an empty response");
        }

        return fullText.toString();
    }

    private String buildRequestBody(String systemPrompt, List<ChatTurn> turns) throws ChatProviderException {
        try {
            var root = mapper.createObjectNode();
            root.put("model", model);
            root.put("max_tokens", maxTokens);
            root.put("stream", true);
            if (systemPrompt != null && !systemPrompt.isBlank()) {
                root.put("system", systemPrompt);
            }

            var messages = mapper.createArrayNode();
            for (ChatTurn turn : sanitize(turns)) {
                var m = mapper.createObjectNode();
                m.put("role", turn.role());
                m.put("content", turn.content());
                messages.add(m);
            }
            root.set("messages", messages);

            return mapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new ChatProviderException("Failed to build Anthropic request: " + e.getMessage(), e);
        }
    }

    /**
     * Anthropic requires the message list to start with a "user" turn and strictly
     * alternate user/assistant. Defensive in case persisted history ever drifts
     * (e.g. a dropped write) — drops a leading assistant turn rather than failing.
     */
    private List<ChatTurn> sanitize(List<ChatTurn> turns) {
        List<ChatTurn> copy = new ArrayList<>(turns);
        while (!copy.isEmpty() && "assistant".equals(copy.get(0).role())) {
            copy.remove(0);
        }
        return copy;
    }
}
