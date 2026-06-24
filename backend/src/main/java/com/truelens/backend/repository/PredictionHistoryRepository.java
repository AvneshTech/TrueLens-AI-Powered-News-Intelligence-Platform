package com.truelens.backend.repository;

import com.truelens.backend.model.PredictionHistory;
import com.truelens.backend.model.PredictionResult;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * PHASE 2: migrated to MongoRepository.
 *
 * Simple lookups/counts are derived queries below. The analytics aggregations
 * (monthly, last-7-days, average confidence, category breakdown) have no derived-query
 * equivalent in MongoDB, so they live in {@link PredictionHistoryRepositoryCustom}
 * and are implemented with MongoTemplate aggregation pipelines
 * (see {@link PredictionHistoryRepositoryImpl}).
 */
public interface PredictionHistoryRepository
        extends MongoRepository<PredictionHistory, String>, PredictionHistoryRepositoryCustom {

    List<PredictionHistory> findByUserId(String userId);

    long countByResult(PredictionResult result);

    long countByUserId(String userId);

    // PHASE 8: per-user scoped counterpart to countByResult — needed so the regular
    // (non-admin) dashboard shows the logged-in user's own fake/real split instead
    // of the platform-wide total every user was previously shown.
    long countByUserIdAndResult(String userId, PredictionResult result);

    List<PredictionHistory> findTop5ByOrderByCreatedAtDesc();

    // PHASE 8: per-user scoped counterpart for the regular dashboard's recent-activity feed.
    List<PredictionHistory> findTop5ByUserIdOrderByCreatedAtDesc(String userId);
}
