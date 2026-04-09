package com.truelens.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FactCheckResponse {

    private boolean verified;

    private String source;

    private String summary;
}