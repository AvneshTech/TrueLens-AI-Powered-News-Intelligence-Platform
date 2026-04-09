package com.truelens.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class HuggingFaceService {

    @Value("${huggingface.api.key}")
    private String apiKey;

    // ✅ Model dynamic (config se aayega)
    @Value("${huggingface.model}")
    private String model;

    // ✅ Use the new Hugging Face router endpoint
    private final String BASE_URL = "https://router.huggingface.co/hf-inference/models/";

    public String getResponse(String message) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = BASE_URL + model; // ✅ dynamic URL

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // ✅ Better prompt format
            String body = """
                    {
                      "inputs": "<s>[INST] %s [/INST]"
                    }
                    """.formatted(message);

            HttpEntity<String> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response =
                    restTemplate.postForEntity(url, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                return "HF Error: " + response.getBody();
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());

            // ✅ Dynamic response handling
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
}