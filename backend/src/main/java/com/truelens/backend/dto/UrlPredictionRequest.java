package com.truelens.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(name = "UrlPredictionRequest", description = "PHASE 6: a URL to fetch and analyze")
public class UrlPredictionRequest {

    @NotBlank(message = "URL is required")
    @Size(max = 2000, message = "URL must not exceed 2000 characters")
    @Pattern(regexp = "^https?://.+", message = "URL must start with http:// or https://")
    @Schema(example = "https://www.example.com/news/article")
    private String url;
}
