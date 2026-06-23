package com.truelens.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.truelens.backend.dto.PredictionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class MlService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

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
        Map<String, String> request = new HashMap<>();
        request.put("text", text);
        return callMlService("/predict/text", request);
    }

    /** PHASE 6: forwards a URL to the ML service for fetch + extraction + prediction. */
    public PredictionResponse predictFromUrl(String url) {
        Map<String, String> request = new HashMap<>();
        request.put("url", url);
        return callMlService("/predict/url", request);
    }

    /** PHASE 6: forwards an uploaded file's bytes to the ML service as multipart/form-data. */
    public PredictionResponse predictFromFile(MultipartFile file) {
        String mlUrl = mlServiceUrl + "/predict/file";

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Could not read the uploaded file", e);
        }

        ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                // The ML service dispatches its parser off the file extension —
                // ByteArrayResource has no filename of its own, so this override
                // is required for it to route to the right extractor.
                return file.getOriginalFilename();
            }
        };

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(mlUrl, requestEntity, Map.class);
            return toPredictionResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            throw mapMlError(e);
        } catch (RestClientException e) {
            throw new RuntimeException(
                    "ML service unavailable. Please ensure the Python service is running on " + mlServiceUrl, e);
        }
    }

    private PredictionResponse callMlService(String path, Object requestBody) {
        String url = mlServiceUrl + path;

        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(url, requestBody, Map.class);
            return toPredictionResponse(response.getBody());
        } catch (HttpClientErrorException e) {
            throw mapMlError(e);
        } catch (RestClientException e) {
            throw new RuntimeException(
                    "ML service unavailable. Please ensure the Python service is running on " + mlServiceUrl, e);
        }
    }

    /**
     * The ML service returns 400/422 with a JSON {@code {"error": "..."}} body for
     * client-side problems (bad URL, unsupported file type, too-short text, …). Surface
     * that message as-is rather than a generic "ML service unavailable" — it's actionable
     * for the caller and isn't a service-health issue.
     *
     * Uses getResponseBodyAsString() + manual parsing rather than getResponseBodyAs(Class),
     * which depends on RestTemplate's internal body-conversion wiring being set up by the
     * error handler — a string + a tiny hand-rolled JSON read is simpler and has no such
     * dependency.
     */
    private RuntimeException mapMlError(HttpClientErrorException e) {
        String body = e.getResponseBodyAsString();
        if (body != null && !body.isBlank()) {
            try {
                Map<?, ?> parsed = OBJECT_MAPPER.readValue(body, Map.class);
                Object error = parsed.get("error");
                if (error != null) {
                    return new IllegalArgumentException(error.toString());
                }
            } catch (Exception ignored) {
                // not JSON, or no "error" key — fall through to the generic message below
            }
        }
        return new IllegalArgumentException("The ML service rejected this request: " + e.getStatusCode());
    }

    @SuppressWarnings("unchecked")
    private PredictionResponse toPredictionResponse(Map body) {
        if (body == null) {
            throw new RuntimeException("Empty response from ML service");
        }

        PredictionResponse.PredictionResponseBuilder builder = PredictionResponse.builder()
                .prediction((String) body.get("prediction"))
                .confidence(((Number) body.get("confidence")).doubleValue());

        if (body.get("explanation") != null) {
            builder.explanation((String) body.get("explanation"));
        }
        if (body.get("domainHint") != null) {
            builder.domainHint((String) body.get("domainHint"));
        }
        if (body.get("extractedWordCount") != null) {
            builder.extractedWordCount(((Number) body.get("extractedWordCount")).intValue());
        }

        return builder.build();
    }
}

