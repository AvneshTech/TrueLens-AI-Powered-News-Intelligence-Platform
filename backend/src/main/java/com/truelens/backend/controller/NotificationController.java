package com.truelens.backend.controller;

import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.model.Notification;
import com.truelens.backend.service.NotificationService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * PHASE 4: notification REST API. All routes are authenticated (SecurityConfig)
 * and scoped to the caller via Authentication#getName().
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResult<List<Notification>> list(Authentication auth) {
        return ApiResult.success(service.list(auth.getName()), "Notifications retrieved");
    }

    @GetMapping("/unread-count")
    public ApiResult<Map<String, Long>> unreadCount(Authentication auth) {
        return ApiResult.success(Map.of("count", service.unreadCount(auth.getName())), "Unread count");
    }

    @PutMapping("/{id}/read")
    public ApiResult<String> markRead(@PathVariable String id, Authentication auth) {
        service.markRead(id, auth.getName());
        return ApiResult.success("Marked as read");
    }

    @PutMapping("/read-all")
    public ApiResult<String> markAllRead(Authentication auth) {
        service.markAllRead(auth.getName());
        return ApiResult.success("All notifications marked as read");
    }

    @DeleteMapping("/{id}")
    public ApiResult<String> delete(@PathVariable String id, Authentication auth) {
        service.delete(id, auth.getName());
        return ApiResult.success("Notification deleted");
    }
}
