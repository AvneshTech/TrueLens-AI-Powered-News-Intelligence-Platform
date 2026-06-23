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
import org.springframework.web.multipart.MultipartFile;

import com.truelens.backend.service.MlService;
import com.truelens.backend.service.PredictionHistoryService;
import com.truelens.backend.service.UserService;
import com.truelens.backend.service.NotificationService;
import com.truelens.backend.model.NotificationType;
import com.truelens.backend.dto.PredictionRequest;
import com.truelens.backend.dto.PredictionResponse;
import com.truelens.backend.dto.UrlPredictionRequest;
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
    private final NotificationService notificationService;

    public DetectionController(MlService mlService,
                               PredictionHistoryService historyService,
                               UserService userService,
                               SimpMessagingTemplate messagingTemplate,
                               NotificationService notificationService) {
        this.mlService = mlService;
        this.historyService = historyService;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
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

        saveToHistoryIfAuthenticated(text, result);

        return ResponseEntity.ok(result);
    }

    /** PHASE 6: analyze the article at a URL instead of pasted text. */
    @PostMapping("/detect/url")
    public ResponseEntity<PredictionResponse> detectFromUrl(@RequestBody @Valid UrlPredictionRequest request) {
        // IllegalArgumentException (thrown by MlService when the ML service rejects
        // the URL — can't fetch, not enough text, unsupported content type, …) is
        // handled globally by GlobalExceptionHandler, which returns a 400 wrapped in
        // the standard ApiResult envelope. No local try/catch needed here.
        PredictionResponse result = mlService.predictFromUrl(request.getUrl().trim());
        saveToHistoryIfAuthenticated("Analyzed from URL: " + request.getUrl(), result);
        return ResponseEntity.ok(result);
    }

    /** PHASE 6: analyze the text extracted from an uploaded document. */
    @PostMapping(value = "/detect/file", consumes = "multipart/form-data")
    public ResponseEntity<PredictionResponse> detectFromFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded");
        }

        PredictionResponse result = mlService.predictFromFile(file);
        saveToHistoryIfAuthenticated("Analyzed from file: " + file.getOriginalFilename(), result);
        return ResponseEntity.ok(result);
    }

    /**
     * Shared by /detect, /detect/url, and /detect/file: persists the analysis to the
     * logged-in user's history and notifies them, but only if a user is actually
     * authenticated (anonymous detections are still returned to the caller, just not saved).
     */
    private void saveToHistoryIfAuthenticated(String content, PredictionResponse result) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null
                || !auth.isAuthenticated()
                || auth.getName() == null
                || "anonymousUser".equals(auth.getName())) {
            return;
        }

        User user = userService.findByEmail(auth.getName());
        String safeContent = content.length() > 3000 ? content.substring(0, 3000) : content;
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
            notificationService.create(user.getEmail(), "Prediction completed",
                    "Your article was analysed as " + predictionResult.name() + ".",
                    NotificationType.PREDICTION, "/predictions");
        } catch (DataIntegrityViolationException ex) {
            logger.warn("Could not save prediction history, returning ML result anyway", ex);
        } catch (Exception ex) {
            logger.error("Unexpected error saving prediction history", ex);
        }
    }
}
