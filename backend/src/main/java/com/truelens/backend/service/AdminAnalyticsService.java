package com.truelens.backend.service;

import com.truelens.backend.dto.AdminAnalytics;
import com.truelens.backend.model.PredictionResult;
import com.truelens.backend.repository.PredictionHistoryRepository;
import com.truelens.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

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
}