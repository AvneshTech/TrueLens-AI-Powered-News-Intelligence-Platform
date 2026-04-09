package com.truelens.backend.dto;

import lombok.Builder;
import lombok.Data;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@Schema(name = "UserResponse", description = "User response payload")
public class UserResponse {

    @Schema(description = "User ID", example = "1")
    private Long id;

    @Schema(description = "User's full name", example = "John Doe")
    private String name;

    @Schema(description = "User's email address", example = "john@example.com")
    private String email;

    @Schema(description = "User's role", example = "USER")
    private String role;

    @Schema(description = "User banned status", example = "false")
    private boolean banned;
}