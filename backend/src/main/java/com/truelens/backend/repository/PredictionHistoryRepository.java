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

    List<PredictionHistory> findTop5ByOrderByCreatedAtDesc();
}
