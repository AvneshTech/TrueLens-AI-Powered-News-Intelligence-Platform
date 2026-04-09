package com.truelens.backend.exception;

import com.truelens.backend.dto.ApiResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice

public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @SuppressWarnings("null")
    private <T> ResponseEntity<ApiResult<T>> wrap(
            boolean success, String message, T data, HttpStatus status) {

        ApiResult<T> resp = ApiResult.<T>builder()
                .success(success)
                .message(message)
                .data(data)
                .build();

        return ResponseEntity.status(status).body(resp);
    }

    // ✅ 1. Validation Errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResult<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(
                        error.getField(),
                        error.getDefaultMessage()));

        return wrap(false, "Validation failed", errors, HttpStatus.BAD_REQUEST);
    }

    // ✅ 2. Custom API Exception (FIXED)
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResult<Void>> handleApiException(ApiException ex) {
        logger.warn("API Exception: {}", ex.getMessage());
        return wrap(false, ex.getMessage(), null, ex.getStatus());
    }

    // ✅ 3. Unauthorized
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResult<Void>> handleUnauthorized(UnauthorizedException ex) {
        logger.warn("Unauthorized: {}", ex.getMessage());
        return wrap(false, ex.getMessage(), null, HttpStatus.UNAUTHORIZED);
    }

    // ✅ 4. Bad JSON / Request body error
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResult<Void>> handleBadRequest(HttpMessageNotReadableException ex) {
        logger.warn("Malformed JSON request", ex);
        return wrap(false, "Invalid request body", null, HttpStatus.BAD_REQUEST);
    }

    // ✅ 5. Database Errors
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResult<Void>> handleDatabaseError(DataIntegrityViolationException ex) {
        logger.error("Database error", ex);
        return wrap(false, "Database error", null, HttpStatus.CONFLICT);
    }

    // ✅ 6. Catch-all (LAST)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResult<Void>> handleAll(Exception ex) {
        logger.error("Unexpected error: ", ex);
        return wrap(false, "Internal server error", null,
                HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResult<Void>> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException ex) {

        logger.warn("Access denied: {}", ex.getMessage());
        return wrap(false, "Access denied", null, HttpStatus.FORBIDDEN);
    }
}