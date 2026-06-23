package com.truelens.backend.service.chat;

/**
 * Provider-agnostic chat turn used to build the outgoing request to whichever
 * {@link ChatProvider} is active. Deliberately decoupled from the persisted
 * {@code Message} document so providers never depend on Mongo types.
 */
public record ChatTurn(String role, String content) {

    public static ChatTurn user(String content) {
        return new ChatTurn("user", content);
    }

    public static ChatTurn assistant(String content) {
        return new ChatTurn("assistant", content);
    }
}
