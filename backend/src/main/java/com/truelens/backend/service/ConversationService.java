package com.truelens.backend.service;

import com.truelens.backend.model.Conversation;
import com.truelens.backend.model.Message;
import com.truelens.backend.model.MessageRole;
import com.truelens.backend.repository.ConversationRepository;
import com.truelens.backend.repository.MessageRepository;
import com.truelens.backend.service.chat.ChatProviderException;
import com.truelens.backend.service.chat.ChatProviderRegistry;
import com.truelens.backend.service.chat.ChatTurn;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

/**
 * PHASE 5: orchestrates persisted, multi-turn AI conversations.
 *
 * Responsibilities:
 *  - own the Conversation/Message documents (CRUD, scoped to the authenticated user)
 *  - build a context-windowed prompt (last N turns) for the provider
 *  - persist the user turn before calling the provider, and the assistant turn after
 *    it finishes streaming, so a dropped connection mid-stream still leaves the user's
 *    message saved
 */
@Service
public class ConversationService {

    /** Cap on prior turns sent to the provider — keeps token usage and latency bounded. */
    private static final int CONTEXT_WINDOW = 20;

    private static final String SYSTEM_PROMPT = """
            You are the TrueLens AI Assistant, a helpful guide focused on news verification,
            fake-news detection, and media literacy. Help users understand why content might
            be credible or suspicious, explain red flags (sensational headlines, missing
            sources, manipulated media, emotional language), and answer general questions
            about how the TrueLens platform works. Keep answers concise and practical.
            """;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ChatProviderRegistry providerRegistry;

    public ConversationService(ConversationRepository conversationRepository,
                                MessageRepository messageRepository,
                                ChatProviderRegistry providerRegistry) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.providerRegistry = providerRegistry;
    }

    // ─── CONVERSATION CRUD ──────────────────────────────────────────────────

    public List<Conversation> listConversations(String userEmail) {
        return conversationRepository.findByUserEmailOrderByUpdatedAtDesc(userEmail);
    }

    public List<Message> getMessages(String conversationId, String userEmail) {
        requireOwnedConversation(conversationId, userEmail);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public Conversation createConversation(String userEmail) {
        Conversation conversation = Conversation.builder()
                .userEmail(userEmail)
                .title("New conversation")
                .build();
        return conversationRepository.save(conversation);
    }

    public void deleteConversation(String conversationId, String userEmail) {
        requireOwnedConversation(conversationId, userEmail);
        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.deleteByIdAndUserEmail(conversationId, userEmail);
    }

    public Conversation renameConversation(String conversationId, String userEmail, String title) {
        Conversation conversation = requireOwnedConversation(conversationId, userEmail);
        conversation.setTitle(title);
        return conversationRepository.save(conversation);
    }

    private Conversation requireOwnedConversation(String conversationId, String userEmail) {
        return conversationRepository.findByIdAndUserEmail(conversationId, userEmail)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
    }

    // ─── STREAMING TURN ─────────────────────────────────────────────────────

    /**
     * Persists the user's message, streams the assistant's reply through
     * {@code onToken}, then persists the complete assistant message.
     *
     * @param conversationId existing conversation id, or {@code null} to create one
     *                       (the new id is reported via {@code onConversationCreated})
     * @return the saved assistant Message
     */
    public Message sendMessage(String conversationId,
                                String userEmail,
                                String userContent,
                                Consumer<String> onToken,
                                Consumer<String> onConversationCreated) throws ChatProviderException {

        Conversation conversation;
        if (conversationId == null || conversationId.isBlank()) {
            conversation = createConversation(userEmail);
            onConversationCreated.accept(conversation.getId());
        } else {
            conversation = requireOwnedConversation(conversationId, userEmail);
        }

        Message userMessage = Message.builder()
                .conversationId(conversation.getId())
                .userEmail(userEmail)
                .role(MessageRole.USER)
                .content(userContent)
                .build();
        messageRepository.save(userMessage);

        maybeSetTitleFromFirstMessage(conversation, userContent);
        conversationRepository.save(conversation);

        List<ChatTurn> turns = buildContextWindow(conversation.getId());

        StringBuilder assistantText = new StringBuilder();
        Consumer<String> tracking = chunk -> {
            assistantText.append(chunk);
            onToken.accept(chunk);
        };

        try {
            providerRegistry.streamCompletion(SYSTEM_PROMPT, turns, tracking);
        } finally {
            // Persist whatever was produced even on failure, as long as something came
            // through — a partial reply is more useful than silently losing the turn.
            if (assistantText.length() > 0) {
                Message assistantMessage = Message.builder()
                        .conversationId(conversation.getId())
                        .userEmail(userEmail)
                        .role(MessageRole.ASSISTANT)
                        .content(assistantText.toString())
                        .build();
                messageRepository.save(assistantMessage);
                conversationRepository.save(conversation);
            }
        }

        return Message.builder()
                .conversationId(conversation.getId())
                .userEmail(userEmail)
                .role(MessageRole.ASSISTANT)
                .content(assistantText.toString())
                .build();
    }

    /** Single-shot, non-streaming helper for internal callers (e.g. news categorization). */
    public String completeOnce(String systemPrompt, String userContent) throws ChatProviderException {
        List<ChatTurn> turns = List.of(ChatTurn.user(userContent));
        StringBuilder result = new StringBuilder();
        providerRegistry.streamCompletion(systemPrompt, turns, result::append);
        return result.toString();
    }

    private void maybeSetTitleFromFirstMessage(Conversation conversation, String firstUserMessage) {
        if (!"New conversation".equals(conversation.getTitle())) {
            return;
        }
        String trimmed = firstUserMessage.strip().replaceAll("\\s+", " ");
        String[] words = trimmed.split(" ");
        String title = String.join(" ", java.util.Arrays.asList(words)
                .subList(0, Math.min(8, words.length)));
        if (title.length() > 60) {
            title = title.substring(0, 60).trim();
        }
        conversation.setTitle(title.isBlank() ? "New conversation" : title);
    }

    private List<ChatTurn> buildContextWindow(String conversationId) {
        List<Message> recent = new ArrayList<>(messageRepository
                .findTop20ByConversationIdOrderByCreatedAtDesc(conversationId));
        Collections.reverse(recent); // oldest-first

        List<ChatTurn> turns = new ArrayList<>();
        // recent already includes the just-saved user message (last element), so this
        // naturally ends with the new turn — no need to append latestUserContent again.
        for (Message m : recent) {
            turns.add(m.getRole() == MessageRole.USER
                    ? ChatTurn.user(m.getContent())
                    : ChatTurn.assistant(m.getContent()));
        }

        if (turns.size() > CONTEXT_WINDOW) {
            turns = turns.subList(turns.size() - CONTEXT_WINDOW, turns.size());
        }
        return turns;
    }
}
