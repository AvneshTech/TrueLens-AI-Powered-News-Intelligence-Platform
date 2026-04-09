package com.truelens.backend.dto;

import com.truelens.backend.model.PredictionResult;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {

    private String text;
    private String newsTitle;
    private String content;

    private PredictionResult result;   // ✅ ADD THIS
    private double confidence;
    private String category;
}
