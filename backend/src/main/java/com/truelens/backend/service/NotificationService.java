package com.truelens.backend.service;

import com.truelens.backend.model.Notification;
import com.truelens.backend.model.NotificationType;
import com.truelens.backend.repository.NotificationRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * PHASE 4: in-app notifications with real-time delivery.
 *
 * On create, the notification is persisted and pushed over STOMP to the owner's
 * per-user topic `/topic/notifications/{email}` so the bell updates live.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repository;
    private final MongoTemplate mongoTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository repository,
                               MongoTemplate mongoTemplate,
                               SimpMessagingTemplate messagingTemplate) {
        this.repository = repository;
        this.mongoTemplate = mongoTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    public Notification create(String userEmail, String title, String message,
                               NotificationType type, String link) {
        Notification n = Notification.builder()
                .userEmail(userEmail)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .read(false)
                .build();

        Notification saved = repository.save(n);

        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + userEmail, saved);
        } catch (Exception e) {
            // Never let a push failure break the originating action.
            log.warn("Failed to push notification to {}: {}", userEmail, e.getMessage());
        }
        return saved;
    }

    /** Convenience overload without a deep link. */
    public Notification create(String userEmail, String title, String message, NotificationType type) {
        return create(userEmail, title, message, type, null);
    }

    public List<Notification> list(String userEmail) {
        return repository.findTop50ByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    public long unreadCount(String userEmail) {
        return repository.countByUserEmailAndReadFalse(userEmail);
    }

    public void markRead(String id, String userEmail) {
        repository.findByIdAndUserEmail(id, userEmail).ifPresent(n -> {
            n.setRead(true);
            repository.save(n);
        });
    }

    public void markAllRead(String userEmail) {
        Query q = new Query(Criteria.where("userEmail").is(userEmail).and("read").is(false));
        mongoTemplate.updateMulti(q, new Update().set("read", true), Notification.class);
    }

    public void delete(String id, String userEmail) {
        repository.deleteByIdAndUserEmail(id, userEmail);
    }
}
