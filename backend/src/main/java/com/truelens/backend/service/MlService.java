package com.truelens.backend.service;

import com.truelens.backend.dto.PredictionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

@Service
public class MlService {

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    // FIX #8: RestTemplate is now injected as a shared Spring bean instead of being
    // instantiated on every predict() call. Per-request construction is expensive:
    // it allocates a new object, skips connection pooling, and prevents configuration
    // (timeouts, interceptors) from being applied uniformly. The bean is declared in AppConfig.
    private final RestTemplate restTemplate;

    public MlService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public PredictionResponse predict(String text) {

        String url = mlServiceUrl + "/predict";

        Map<String, String> request = new HashMap<>();
        request.put("text", text);

        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(url, request, Map.class);

            Map body = response.getBody();

            if (body == null) {
                throw new RuntimeException("Empty response from ML service");
            }

            return PredictionResponse.builder()
                    .prediction((String) body.get("prediction"))
                    .confidence(((Number) body.get("confidence")).doubleValue())
                    .build();

        } catch (RestClientException e) {
            throw new RuntimeException("ML service unavailable. Please ensure the Python service is running on " + mlServiceUrl, e);
        }
    }
}

