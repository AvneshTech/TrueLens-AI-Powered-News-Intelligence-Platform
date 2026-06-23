package com.truelens.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(name = "ChatStreamRequest", description = "Payload to send a chat message and stream the reply")
public class ChatStreamRequest {

    @NotBlank(message = "Message cannot be blank")
    @Size(max = 4000, message = "Message must not exceed 4000 characters")
    @Schema(description = "The user's message", example = "Is this article likely fake news?")
    private String message;

    @Schema(description = "Existing conversation id to continue, or omit to start a new one")
    private String conversationId;
}
