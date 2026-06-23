package com.truelens.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PredictionResponse {

    private String prediction;
    private double confidence;

    // PHASE 6: populated only for /detect/url and /detect/file — null/omitted for
    // plain text analysis where there's no source document to describe.
    private String explanation;
    private String domainHint;
    private Integer extractedWordCount;
}