package com.truelens.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.truelens.backend.service.MlService;
import com.truelens.backend.service.PredictionHistoryService;
import com.truelens.backend.service.UserService;
import com.truelens.backend.dto.PredictionRequest;
import com.truelens.backend.dto.PredictionResponse;
import com.truelens.backend.model.PredictionHistory;
import com.truelens.backend.model.PredictionResult;
import com.truelens.backend.model.User;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DetectionController {

    private static final Logger logger = LoggerFactory.getLogger(DetectionController.class);

    @Autowired
    private MlService mlService;

    @Autowired
    private PredictionHistoryService historyService;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/detect")
    public ResponseEntity<PredictionResponse> detect(
            @RequestBody PredictionRequest request) {

        if (request == null || request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.badRequest().body(
                    PredictionResponse.builder()
                            .prediction("UNKNOWN")
                            .confidence(0.0)
                            .build());
        }

        String text = request.getText().trim();
        PredictionResponse result = mlService.predict(text);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null
                && auth.isAuthenticated()
                && auth.getName() != null
                && !"anonymousUser".equals(auth.getName())) {

            User user = userService.findByEmail(auth.getName());
            String safeContent = text.length() > 3000 ? text.substring(0, 3000) : text;
            String title = safeContent.length() > 100
                    ? safeContent.substring(0, 100) + "..."
                    : safeContent;

            PredictionHistory history = PredictionHistory.builder()
                    .newsTitle(title)
                    .content(safeContent)
                    .result("Real".equalsIgnoreCase(result.getPrediction())
                            ? PredictionResult.REAL
                            : PredictionResult.FAKE)
                    .confidence(result.getConfidence())
                    .userId(user.getId())
                    .build();

            try {
                historyService.savePrediction(history);
                messagingTemplate.convertAndSend("/topic/predictions", "update");
            } catch (DataIntegrityViolationException ex) {
                logger.warn("Could not save prediction history, returning ML result anyway", ex);
            } catch (Exception ex) {
                logger.error("Unexpected error saving prediction history", ex);
            }
        }

        return ResponseEntity.ok(result);
    }
}
