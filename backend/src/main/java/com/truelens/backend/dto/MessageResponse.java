package com.truelens.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@Schema(name = "MessageResponse", description = "A single turn in a chat conversation")
public class MessageResponse {
    private String id;
    private String role;
    private String content;
    private LocalDateTime createdAt;
}
