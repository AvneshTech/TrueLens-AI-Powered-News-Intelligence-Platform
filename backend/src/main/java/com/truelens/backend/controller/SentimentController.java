package com.truelens.backend.controller;

import com.truelens.backend.service.HuggingFaceService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * FIX C-5: server-side sentiment analysis.
 *
 * Previously the frontend called Hugging Face directly with the HF API key
 * inlined into the public JS bundle (any VITE_* var is shipped to the browser).
 * Sentiment inference now runs on the backend with the key kept in server env,
 * exactly like /api/chat. The route is authenticated (see SecurityConfig) and
 * rate-limited (see RateLimitFilter).
 */
@RestController
@RequestMapping("/api")
public class SentimentController {

    private final HuggingFaceService huggingFaceService;

    public SentimentController(HuggingFaceService huggingFaceService) {
        this.huggingFaceService = huggingFaceService;
    }

    @PostMapping("/sentiment")
    public ResponseEntity<?> analyze(@RequestBody Map<String, String> body) {

        String text = body.get("text");

        if (text == null || text.isBlank()) {
            return ResponseEntity.ok(Map.of("sentiment", "Neutral", "score", 0.0));
        }

        return ResponseEntity.ok(huggingFaceService.analyzeSentiment(text));
    }
}
