package com.truelens.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class HuggingFaceService {

    @Value("${huggingface.api.key}")
    private String apiKey;

    // ✅ Chat model (from config)
    @Value("${huggingface.model}")
    private String model;

    // FIX C-5: sentiment model is server-side now (was called from the browser with
    // the HF key inlined into the public bundle). Configurable, with a sane default.
    @Value("${huggingface.sentiment-model:cardiffnlp/twitter-roberta-base-sentiment}")
    private String sentimentModel;

    private final String BASE_URL = "https://router.huggingface.co/hf-inference/models/";

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    // FIX M-11/M-12: reuse the shared, timeout-configured RestTemplate bean
    // instead of constructing a new, timeout-less client per call.
    public HuggingFaceService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String getResponse(String message) {
        try {
            String url = BASE_URL + model;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String body = """
                    {
                      "inputs": "<s>[INST] %s [/INST]"
                    }
                    """.formatted(escape(message));

            HttpEntity<String> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response =
                    restTemplate.postForEntity(url, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                return "HF Error: " + response.getBody();
            }

            JsonNode root = mapper.readTree(response.getBody());

            if (root.isArray() && root.size() > 0) {
                return root.get(0).path("generated_text").asText();
            } else if (root.has("error")) {
                return "HF Error: " + root.get("error").asText();
            }

            return "No response from AI";

        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    /**
     * FIX C-5: server-side sentiment inference. The HF API key never leaves the server.
     * Returns {"sentiment": Positive|Neutral|Negative, "score": 0..1}.
     */
    public Map<String, Object> analyzeSentiment(String text) {
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("sentiment", "Neutral");
        fallback.put("score", 0.0);

        try {
            if (text == null || text.isBlank()) {
                return fallback;
            }

            // Cap input to keep within the model's token budget
            String input = text.trim();
            if (input.length() > 2000) {
                String truncated = input.substring(0, 2000);
                int lastSpace = truncated.lastIndexOf(' ');
                input = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
            }

            String url = BASE_URL + sentimentModel;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String body = """
                    {
                      "inputs": "%s",
                      "parameters": { "truncation": true, "max_length": 512 }
                    }
                    """.formatted(escape(input));

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response =
                    restTemplate.postForEntity(url, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                return fallback;
            }

            JsonNode root = mapper.readTree(response.getBody());

            // Response can be [[{label,score}, ...]] or [{label,score}, ...]
            JsonNode first = root;
            if (root.isArray() && root.size() > 0) {
                first = root.get(0);
            }
            if (first.isArray() && first.size() > 0) {
                first = first.get(0);
            }

            if (first == null || !first.has("label")) {
                return fallback;
            }

            String label = first.path("label").asText();
            double score = first.path("score").asDouble(0.0);

            String sentiment = switch (label) {
                case "LABEL_2" -> "Positive";
                case "LABEL_0" -> "Negative";
                default -> "Neutral";
            };

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("sentiment", sentiment);
            result.put("score", score);
            return result;

        } catch (Exception e) {
            return fallback;
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", " ")
                .replace("\r", " ");
    }
}
