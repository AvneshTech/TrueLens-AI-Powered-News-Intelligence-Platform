package com.truelens.backend.controller;

import com.truelens.backend.dto.PredictionRequest;
import com.truelens.backend.model.PredictionHistory;
import com.truelens.backend.service.PredictionHistoryService;
import com.truelens.backend.service.UserService;
import com.truelens.backend.model.User;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin("*")
public class PredictionHistoryController {

    private final PredictionHistoryService service;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public PredictionHistoryController(PredictionHistoryService service, UserService userService, SimpMessagingTemplate messagingTemplate) {
        this.service = service;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    // ✅ SAVE PREDICTION (FIXED)
    @PostMapping
    public PredictionHistory savePrediction(@Valid @RequestBody PredictionRequest request) {

        // Get the logged-in user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.findByEmail(email);

        PredictionHistory history = new PredictionHistory();

        history.setNewsTitle(request.getNewsTitle());
        history.setContent(request.getContent());

        // ✅ IMPORTANT FIX (NO HARD CODE)
        history.setResult(request.getResult());
        history.setConfidence(request.getConfidence());
        history.setCategory(request.getCategory()); // ✅ ADD CATEGORY
        history.setUserId(user.getId());

        history.setCreatedAt(LocalDateTime.now());

        PredictionHistory saved = service.savePrediction(history);

        // Send WebSocket update
        messagingTemplate.convertAndSend("/topic/predictions", "update");

        return saved;
    }

    // ✅ GET ALL HISTORY
    @GetMapping
    public List<PredictionHistory> getAllHistory() {
        return service.getAllHistory();
    }
}