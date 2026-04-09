package com.truelens.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PredictionResponse {

    private String prediction;
    private double confidence;
}