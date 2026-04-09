package com.truelens.backend.repository;

import com.truelens.backend.model.PredictionHistory;
import com.truelens.backend.model.PredictionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PredictionHistoryRepository extends JpaRepository<PredictionHistory, Long> {

    List<PredictionHistory> findByUserId(Long userId);

    long countByResult(PredictionResult result);

    // ✅ MONTHLY TOTAL
    @Query("""
        SELECT FUNCTION('MONTH', p.createdAt), COUNT(p)
        FROM PredictionHistory p
        GROUP BY FUNCTION('MONTH', p.createdAt)
        ORDER BY FUNCTION('MONTH', p.createdAt)
    """)
    List<Object[]> countByMonth();

    // ✅ MONTHLY REAL vs FAKE
    @Query("""
        SELECT FUNCTION('MONTH', p.createdAt), p.result, COUNT(p)
        FROM PredictionHistory p
        GROUP BY FUNCTION('MONTH', p.createdAt), p.result
        ORDER BY FUNCTION('MONTH', p.createdAt)
    """)
    List<Object[]> countByMonthAndResult();

    // ✅ LAST 7 DAYS
    @Query(value = """
        SELECT DAYOFWEEK(created_at), COUNT(*)
        FROM prediction_history
        WHERE created_at >= CURRENT_DATE - INTERVAL 7 DAY
        GROUP BY DAYOFWEEK(created_at)
    """, nativeQuery = true)
    List<Object[]> countLast7Days();

    // ✅ AVG CONFIDENCE
    @Query("SELECT AVG(p.confidence) FROM PredictionHistory p")
    Double averageConfidence();
}