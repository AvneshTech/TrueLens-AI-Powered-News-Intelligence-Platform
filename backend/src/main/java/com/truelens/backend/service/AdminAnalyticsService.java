package com.truelens.backend.service;

import com.truelens.backend.dto.AdminAnalytics;
import com.truelens.backend.model.PredictionHistory;
import com.truelens.backend.model.PredictionResult;
import com.truelens.backend.repository.PredictionHistoryRepository;
import com.truelens.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminAnalyticsService {

    private final UserRepository userRepository;
    private final PredictionHistoryRepository predictionRepository;

    public AdminAnalyticsService(UserRepository userRepository,
                                 PredictionHistoryRepository predictionRepository) {

        this.userRepository = userRepository;
        this.predictionRepository = predictionRepository;
    }

    public AdminAnalytics getAnalytics() {

        long totalUsers = userRepository.count();

        long totalPredictions = predictionRepository.count();

        long fakeNews =
                predictionRepository.countByResult(PredictionResult.FAKE);

        long realNews =
                predictionRepository.countByResult(PredictionResult.REAL);

        return AdminAnalytics.builder()
                .totalUsers(totalUsers)
                .totalPredictions(totalPredictions)
                .fakeNews(fakeNews)
                .realNews(realNews)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // FIX H-3: real analytics builders shared by the user dashboard
    // (AnalyticsController) and the admin dashboard (AdminController).
    // These replace the previously fabricated activity/category data.
    // ──────────────────────────────────────────────────────────────

    /**
     * Real last-7-day activity series, one entry per weekday (Mon→Sun).
     * Sources the native DAYOFWEEK(created_at) aggregate (1=Sun … 7=Sat).
     */
    public List<Map<String, Object>> getActivityLast7Days() {
        // MySQL DAYOFWEEK: 1=Sun, 2=Mon, … 7=Sat → map to a count per day
        Map<Integer, Long> byDow = new HashMap<>();
        for (Object[] row : predictionRepository.countLast7Days()) {
            int dow = ((Number) row[0]).intValue();
            long count = ((Number) row[1]).longValue();
            byDow.put(dow, count);
        }

        // Present Mon→Sun for a stable, readable chart
        int[] order = {2, 3, 4, 5, 6, 7, 1};
        String[] names = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};

        List<Map<String, Object>> activity = new ArrayList<>();
        for (int i = 0; i < order.length; i++) {
            Map<String, Object> day = new HashMap<>();
            day.put("name", names[i]);
            day.put("value", byDow.getOrDefault(order[i], 0L));
            activity.add(day);
        }
        return activity;
    }

    /**
     * Real category breakdown grouped from stored predictions.
     * Replaces the invented Politics/Tech/Health arithmetic split.
     */
    public List<Map<String, Object>> getCategoryBreakdown() {
        Map<String, long[]> byCategory = new LinkedHashMap<>(); // [fake, real]

        for (Object[] row : predictionRepository.countByCategoryAndResult()) {
            String category = row[0] != null ? row[0].toString() : "Uncategorized";
            PredictionResult result = (PredictionResult) row[1];
            long count = ((Number) row[2]).longValue();

            long[] split = byCategory.computeIfAbsent(category, k -> new long[2]);
            if (result == PredictionResult.FAKE) {
                split[0] += count;
            } else if (result == PredictionResult.REAL) {
                split[1] += count;
            }
        }

        List<Map<String, Object>> categories = new ArrayList<>();
        for (Map.Entry<String, long[]> e : byCategory.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", e.getKey());
            map.put("fake", e.getValue()[0]);
            map.put("real", e.getValue()[1]);
            categories.add(map);
        }
        return categories;
    }

    /**
     * Five most recent predictions across the platform for the admin feed.
     */
    public List<Map<String, Object>> getRecentActivity() {
        List<Map<String, Object>> recent = new ArrayList<>();
        for (PredictionHistory p : predictionRepository.findTop5ByOrderByCreatedAtDesc()) {
            Map<String, Object> map = new HashMap<>();
            map.put("title", p.getNewsTitle());
            map.put("result", p.getResult() != null ? p.getResult().name() : "UNKNOWN");
            map.put("confidence", p.getConfidence());
            map.put("createdAt", p.getCreatedAt());
            recent.add(map);
        }
        return recent;
    }
}
