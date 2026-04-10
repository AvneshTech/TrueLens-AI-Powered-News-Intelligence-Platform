package com.truelens.backend.controller;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
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
// FIX #15 (merged here): Removed @CrossOrigin("*") which overrode the global CORS policy
// in SecurityConfig. All CORS is now controlled centrally in SecurityConfig.
public class DetectionController {

    private static final Logger logger = LoggerFactory.getLogger(DetectionController.class);

    // FIX #7: Replaced @Autowired field injection with constructor injection.
    // Constructor injection is the Spring-recommended approach — it makes dependencies
    // explicit, enables proper unit testing without a Spring context, and ensures
    // the bean is never in a partially-initialised state.
    private final MlService mlService;
    private final PredictionHistoryService historyService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public DetectionController(MlService mlService,
                               PredictionHistoryService historyService,
                               UserService userService,
                               SimpMessagingTemplate messagingTemplate) {
        this.mlService = mlService;
        this.historyService = historyService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/detect")
    public ResponseEntity<PredictionResponse> detect(
            @RequestBody @Valid PredictionRequest request) {

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

            // FIX #9: Previously only checked for "Real" and defaulted everything else
            // to FAKE — meaning "Uncertain" was silently stored as FAKE, corrupting history.
            // Now all three labels are mapped explicitly.
            PredictionResult predictionResult;
            String pred = result.getPrediction();
            if ("Real".equalsIgnoreCase(pred)) {
                predictionResult = PredictionResult.REAL;
            } else if ("Uncertain".equalsIgnoreCase(pred)) {
                predictionResult = PredictionResult.UNCERTAIN;
            } else {
                predictionResult = PredictionResult.FAKE;
            }

            PredictionHistory history = PredictionHistory.builder()
                    .newsTitle(title)
                    .content(safeContent)
                    .result(predictionResult)
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
