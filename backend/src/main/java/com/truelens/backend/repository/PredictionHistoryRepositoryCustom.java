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
 */
public interface PredictionHistoryRepositoryCustom {

    List<Object[]> countByMonth();

    List<Object[]> countByMonthAndResult();

    List<Object[]> countLast7Days();

    Double averageConfidence();

    List<Object[]> countByCategoryAndResult();
}
