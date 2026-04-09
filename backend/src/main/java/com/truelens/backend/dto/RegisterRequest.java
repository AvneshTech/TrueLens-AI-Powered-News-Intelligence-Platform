
// package com.truelens.backend.dto;

// import lombok.Getter;
// import lombok.Setter;
// import io.swagger.v3.oas.annotations.media.Schema;

// @Getter
// @Setter
// @Schema(name = "RegisterRequest", description = "User registration request payload")
// public class RegisterRequest {

//     @Schema(description = "User's full name", example = "John Doe")
//     private String fullName;

//     @Schema(description = "User's email address", example = "john@example.com")
//     private String email;

//     @Schema(description = "User's password", example = "password123")
//     private String password;

// }

package com.truelens.backend.dto;

import lombok.Getter;
import lombok.Setter;
import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@Schema(name = "RegisterRequest", description = "User registration request payload")
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, message = "Full name must be at least 2 characters")
    @Schema(description = "User's full name", example = "Avnesh Kumar")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(example = "example@gmail.com", description = "User email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Schema(example = "abcd123", description = "User password")
    private String password;
}