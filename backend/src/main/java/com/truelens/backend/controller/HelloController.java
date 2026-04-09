package com.truelens.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.truelens.backend.dto.ApiResult;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@Tag(name = "Health Check", description = "Application health check endpoint")
public class HelloController {

    @GetMapping("/")
    @Operation(summary = "Health check", description = "Verifies that the backend is running")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Backend is running successfully")
    })
    public ApiResult<String> home() {
        return ApiResult.<String>builder()
                .success(true)
                .message("Health check OK")
                .data("TrueLens Backend Running 🚀")
                .build();
    }
}
