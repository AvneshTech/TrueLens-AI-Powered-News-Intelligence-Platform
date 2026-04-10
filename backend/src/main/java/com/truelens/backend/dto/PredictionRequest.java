package com.truelens.backend.dto;

import com.truelens.backend.model.PredictionResult;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {

    // FIX #12: Added validation annotations to the text field.
    // Without them, null/blank/huge payloads bypassed the manual null-check in
    // DetectionController and could reach the ML service unchecked.
    @NotBlank(message = "Text is required")
    @Size(max = 10000, message = "Text must not exceed 10,000 characters")
    private String text;

    private String newsTitle;
    private String content;

    private PredictionResult result;
    private double confidence;
    private String category;
}
