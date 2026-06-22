package com.truelens.backend.controller;

import com.truelens.backend.model.PredictionHistory;
import com.truelens.backend.service.PredictionHistoryService;
import com.truelens.backend.service.UserService;
import com.truelens.backend.model.User;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

/**
 * Prediction history endpoints.
 *
 * FIX C-1: GET now returns ONLY the authenticated user's history
 *          (was returning findAll() → every user's submissions leaked).
 * FIX C-6: removed @CrossOrigin("*"); CORS is centralised in SecurityConfig.
 * FIX H-9: removed the public POST writer. Prediction history is persisted
 *          server-side by DetectionController (/api/detect); the second POST
 *          here caused duplicate rows and inflated every analytics count.
 */
@RestController
@RequestMapping("/api/predictions")
public class PredictionHistoryController {

    private final PredictionHistoryService service;
    private final UserService userService;

    public PredictionHistoryController(PredictionHistoryService service, UserService userService) {
        this.service = service;
        this.userService = userService;
    }

    // ✅ GET ONLY THE CURRENT USER'S HISTORY (C-1)
    @GetMapping
    public List<PredictionHistory> getMyHistory(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        return service.getUserHistory(user.getId());
    }
}
