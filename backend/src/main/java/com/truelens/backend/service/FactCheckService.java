package com.truelens.backend.service;

import com.truelens.backend.dto.FactCheckResponse;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/**
 * FactCheckService provides fake news detection capabilities for the TrueLens platform.
 * This service analyzes news content to determine credibility and identify potential misinformation.
 *
 * Enhanced Implementation: Multi-factor analysis
 * - Keywords indicating sensationalism or conspiracy
 * - Clickbait patterns and exaggerated claims
 * - Source credibility indicators
 * - Linguistic analysis for manipulative language
 *
 * Future Enhancement: Integrate with ML models, fact-checking APIs, and advanced NLP algorithms
 * for more accurate and comprehensive fake news detection.
 */
@Service
public class FactCheckService {

    // Keywords that often indicate fake or sensational content
    private static final List<String> FAKE_NEWS_KEYWORDS = Arrays.asList(
        "alien", "miracle", "conspiracy", "secret", "shocking", "unbelievable",
        "cure", "breakthrough", "scandal", "exposed", "truth", "hidden",
        "forbidden", "banned", "censored", "elite", "illuminati", "deep state"
    );

    // Clickbait patterns
    private static final List<String> CLICKBAIT_PATTERNS = Arrays.asList(
        "you won't believe", "this will blow your mind", "what happened next",
        "the real reason", "they don't want you to know", "emergency alert"
    );

    // Exaggerated superlatives
    private static final List<String> EXAGGERATED_WORDS = Arrays.asList(
        "worst ever", "best ever", "most dangerous", "ultimate", "revolutionary",
        "game-changing", "life-changing", "world-shattering"
    );

    /**
     * Verifies the credibility of news content based on the title.
     * Uses multi-factor analysis including keywords, patterns, and linguistic indicators
     * to assess potential misinformation.
     *
     * Analysis factors:
     * - Presence of fake news keywords
     * - Clickbait language patterns
     * - Exaggerated claims
     * - Sensationalism indicators
     *
     * @param title The news headline to analyze
     * @return FactCheckResponse indicating verification status and reasoning
     */
    public FactCheckResponse verifyNews(String title) {
        if (title == null || title.trim().isEmpty()) {
            return FactCheckResponse.builder()
                    .verified(false)
                    .source("Content Analysis")
                    .summary("Empty or null content cannot be verified")
                    .build();
        }

        String lowerTitle = title.toLowerCase();
        int riskScore = 0;
        StringBuilder reasons = new StringBuilder();

        // Check for fake news keywords
        for (String keyword : FAKE_NEWS_KEYWORDS) {
            if (lowerTitle.contains(keyword)) {
                riskScore += 2;
                reasons.append("Contains suspicious keyword: ").append(keyword).append(". ");
                break; // Only count once for keywords
            }
        }

        // Check for clickbait patterns
        for (String pattern : CLICKBAIT_PATTERNS) {
            if (lowerTitle.contains(pattern)) {
                riskScore += 3;
                reasons.append("Uses clickbait language. ");
                break;
            }
        }

        // Check for exaggerated claims
        for (String word : EXAGGERATED_WORDS) {
            if (lowerTitle.contains(word)) {
                riskScore += 1;
                reasons.append("Contains exaggerated claims. ");
                break;
            }
        }

        // Check for multiple exclamation marks (sensationalism)
        long exclamationCount = title.chars().filter(ch -> ch == '!').count();
        if (exclamationCount > 1) {
            riskScore += 1;
            reasons.append("Excessive punctuation indicates sensationalism. ");
        }

        // Check for ALL CAPS words (shouting/sensationalism)
        String[] words = title.split("\\s+");
        int capsWords = 0;
        for (String word : words) {
            if (word.length() > 3 && word.equals(word.toUpperCase())) {
                capsWords++;
            }
        }
        if (capsWords > 0) {
            riskScore += capsWords;
            reasons.append("ALL CAPS words indicate sensationalism. ");
        }

        // Determine verification status based on risk score
        boolean isVerified = riskScore < 3; // Threshold for fake news
        String summary;
        String source = "AI Content Analysis";

        if (isVerified) {
            summary = "Content appears credible based on linguistic analysis. " +
                     "However, always verify with multiple trusted sources.";
        } else {
            summary = "Content shows signs of potential misinformation. " +
                     reasons.toString().trim() +
                     " Please verify with reputable fact-checking sources.";
        }

        return FactCheckResponse.builder()
                .verified(isVerified)
                .source(source)
                .summary(summary)
                .build();
    }
}