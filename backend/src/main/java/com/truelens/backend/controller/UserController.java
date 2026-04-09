package com.truelens.backend.controller;

import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.dto.UserResponse;
import com.truelens.backend.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

/**
 * REST Controller for user-related operations
 * All endpoints require JWT authentication
 */
@RestController
@RequestMapping("/api/user")
@Tag(name = "User", description = "User profile endpoints - requires authentication")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER','ADMIN')")
    @Operation(summary = "Get current user profile", 
               description = "Retrieves the profile information of the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - token invalid or missing"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ApiResult<UserResponse> getCurrentUser(Authentication authentication) {

        String email = authentication.getName();

        UserResponse user = userService.getCurrentUser(email);
        return ApiResult.<UserResponse>builder()
                .success(true)
                .message("User profile retrieved successfully")
                .data(user)
                .build();
    }
}
