package com.truelens.backend.service.chat;

/** Wraps any upstream chat-provider failure (HTTP error, timeout, malformed stream, …). */
public class ChatProviderException extends Exception {

    public ChatProviderException(String message) {
        super(message);
    }

    public ChatProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
