package com.truelens.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminAnalytics {

    private long totalUsers;

    private long totalPredictions;

    private long fakeNews;

    private long realNews;
}