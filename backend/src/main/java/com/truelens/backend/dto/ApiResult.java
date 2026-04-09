package com.truelens.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * Generic wrapper for all API responses.
 *
 * @param <T> type of the payload
 */
@Data
@Builder
@Schema(name = "ApiResult", description = "Standard API response wrapper")
public class ApiResult<T> {

    private boolean success;
    private String message;
    private T data;

    // ✅ SUCCESS RESPONSE
    public static <T> ApiResult<T> success(T data, String message) {
        return ApiResult.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    // ✅ SUCCESS WITHOUT DATA
    public static <T> ApiResult<T> success(String message) {
        return ApiResult.<T>builder()
                .success(true)
                .message(message)
                .data(null)
                .build();
    }

    // ✅ ERROR RESPONSE (Optional but recommended)
    public static <T> ApiResult<T> error(String message) {
        return ApiResult.<T>builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}