package com.truelens.backend.repository;

import java.util.List;

/**
 * PHASE 2: aggregation queries that have no MongoDB derived-query form.
 * Each returns Object[] rows with the SAME shapes the previous JPQL/native queries
 * returned, so AnalyticsService / AdminAnalyticsService consume them unchanged:
 *
 *   countByMonth()            → [Integer month, Long count]
 *   countByMonthAndResult()   → [Integer month, PredictionResult result, Long count]
 *   countLast7Days()          → [Integer dayOfWeek(1=Sun…7=Sat), Long count]
 *   averageConfidence()       → Double (nullable)
 *   countByCategoryAndResult()→ [String category, PredictionResult result, Long count]
 *
 * PHASE 8: user-scoped variants of the last two, added so the regular (non-admin)
 * dashboard can show the logged-in user's own activity/category breakdown instead
 * of the platform-wide aggregate every user was previously shown.
 *
 *   countLast7DaysForUser(userId)             → same shape as countLast7Days()
 *   countByCategoryAndResultForUser(userId)   → same shape as countByCategoryAndResult()
 */
public interface PredictionHistoryRepositoryCustom {

    List<Object[]> countByMonth();

    List<Object[]> countByMonthAndResult();

    List<Object[]> countLast7Days();

    Double averageConfidence();

    List<Object[]> countByCategoryAndResult();

    List<Object[]> countLast7DaysForUser(String userId);

    List<Object[]> countByCategoryAndResultForUser(String userId);
}
