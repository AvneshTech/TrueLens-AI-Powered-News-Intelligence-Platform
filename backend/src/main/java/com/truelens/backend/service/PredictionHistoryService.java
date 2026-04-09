package com.truelens.backend.service;

import com.truelens.backend.dto.AdminAnalytics;
import com.truelens.backend.model.PredictionHistory;
import com.truelens.backend.model.PredictionResult;
import com.truelens.backend.repository.PredictionHistoryRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PredictionHistoryService {

    private final PredictionHistoryRepository repository;

    public PredictionHistoryService(PredictionHistoryRepository repository) {
        this.repository = repository;
    }

    public PredictionHistory savePrediction(@NonNull PredictionHistory history) {
        return repository.save(history);
    }

    public List<PredictionHistory> getUserHistory(Long userId) {
        return repository.findByUserId(userId);
    }

    public List<PredictionHistory> getAllHistory() {
        return repository.findAll();
    }

    public AdminAnalytics getAnalytics() {

        long total = repository.count();

        long fake = repository.countByResult(PredictionResult.FAKE);

        long real = repository.countByResult(PredictionResult.REAL);

        return AdminAnalytics.builder()
                .totalPredictions(total)
                .fakeNews(fake)
                .realNews(real)
                .build();
    }
}