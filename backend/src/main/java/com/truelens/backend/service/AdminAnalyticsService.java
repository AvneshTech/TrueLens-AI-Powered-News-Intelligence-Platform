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

    /**
     * PHASE 8: per-user counterpart to getAnalytics() — powers the regular (non-admin)
     * dashboard. Deliberately omits totalUsers (a platform-wide figure that has no
     * per-user meaning); totalPredictions/fakeNews/realNews are scoped to this user
     * only, fixing a real bug where every user's personal dashboard was previously
     * showing platform-wide totals across all users.
     */
    public AdminAnalytics getAnalyticsForUser(String userId) {
        long totalPredictions = predictionRepository.countByUserId(userId);
        long fakeNews = predictionRepository.countByUserIdAndResult(userId, PredictionResult.FAKE);
        long realNews = predictionRepository.countByUserIdAndResult(userId, PredictionResult.REAL);

        return AdminAnalytics.builder()
                .totalUsers(0) // not meaningful per-user; AnalyticsController omits this stat card
                .totalPredictions(totalPredictions)
                .fakeNews(fakeNews)
                .realNews(realNews)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // FIX H-3: real analytics builders shared by the user dashboard
    // (AnalyticsController) and the admin dashboard (AdminController).
    // These replace the previously fabricated activity/category data.
    //
    // PHASE 8: each now takes an optional userId — null means platform-wide
    // (used by the admin dashboard), a real id scopes the result to that user
    // (used by the regular dashboard). Previously these were always
    // platform-wide, so every regular user's "personal" dashboard was actually
    // showing every user's combined activity, including other users' article
    // titles in the recent-activity feed.
    // ──────────────────────────────────────────────────────────────

    /**
     * Last-7-day activity series, one entry per weekday (Mon→Sun).
     * Sources the $dayOfWeek aggregate (1=Sun … 7=Sat, same numbering MySQL used).
     */
    public List<Map<String, Object>> getActivityLast7Days(String userId) {
        List<Object[]> rows = userId == null
                ? predictionRepository.countLast7Days()
                : predictionRepository.countLast7DaysForUser(userId);

        Map<Integer, Long> byDow = new HashMap<>();
        for (Object[] row : rows) {
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
     * Category breakdown grouped from stored predictions.
     * Replaces the invented Politics/Tech/Health arithmetic split.
     */
    public List<Map<String, Object>> getCategoryBreakdown(String userId) {
        List<Object[]> rows = userId == null
                ? predictionRepository.countByCategoryAndResult()
                : predictionRepository.countByCategoryAndResultForUser(userId);

        Map<String, long[]> byCategory = new LinkedHashMap<>(); // [fake, real]

        for (Object[] row : rows) {
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
     * Five most recent predictions — platform-wide (userId null, admin feed) or
     * scoped to one user (regular dashboard).
     */
    public List<Map<String, Object>> getRecentActivity(String userId) {
        List<PredictionHistory> recentPredictions = userId == null
                ? predictionRepository.findTop5ByOrderByCreatedAtDesc()
                : predictionRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> recent = new ArrayList<>();
        for (PredictionHistory p : recentPredictions) {
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
