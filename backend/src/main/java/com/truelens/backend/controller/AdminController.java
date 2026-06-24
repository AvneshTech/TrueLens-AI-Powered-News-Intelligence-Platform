package com.truelens.backend.controller;

import com.truelens.backend.dto.*;
import com.truelens.backend.model.User;
import com.truelens.backend.repository.NoteRepository;
import com.truelens.backend.repository.PredictionHistoryRepository;
import com.truelens.backend.repository.UserRepository;
import com.truelens.backend.service.AdminAnalyticsService;
import com.truelens.backend.service.NoteService;
import com.truelens.backend.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Admin endpoints. All routes are gated to ROLE_ADMIN in SecurityConfig.
 *
 * FIX C-6: removed controller-level @CrossOrigin (CORS centralised in SecurityConfig).
 * FIX H-2: added the previously-dead GET /api/admin/analytics and
 *          DELETE /api/admin/notes/{id} endpoints the frontend already calls.
 * FIX H-3: per-user prediction/note counts and dashboard activity/category/recent
 *          data are now real aggregates, not hard-coded 0s / fabricated deltas.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final NoteService noteService;
    private final PredictionHistoryRepository predictionRepository;
    private final NoteRepository noteRepository;

    public AdminController(AdminAnalyticsService adminAnalyticsService,
            UserRepository userRepository,
            UserService userService,
            NoteService noteService,
            PredictionHistoryRepository predictionRepository,
            NoteRepository noteRepository) {
        this.adminAnalyticsService = adminAnalyticsService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.noteService = noteService;
        this.predictionRepository = predictionRepository;
        this.noteRepository = noteRepository;
    }

    // ==========================================
    // DASHBOARD
    // ==========================================
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResult<DashboardResponse>> getAdminDashboard() {

        AdminAnalytics rawStats = adminAnalyticsService.getAnalytics();

        // FIX H-3: removed fabricated "+12%"/"-2%"/"+8%" deltas (no period-over-period
        // baseline exists). trend left neutral until a real comparison is implemented.
        List<StatCard> stats = List.of(
                new StatCard("Total Users", String.valueOf(rawStats.getTotalUsers()), "", "neutral"),
                new StatCard("Total Articles Analyzed", String.valueOf(rawStats.getTotalPredictions()), "", "neutral"),
                new StatCard("Fake News Detected", String.valueOf(rawStats.getFakeNews()), "", "neutral"),
                new StatCard("Real News Verified", String.valueOf(rawStats.getRealNews()), "", "neutral"));

        List<Map<String, Object>> pieData = List.of(
                mapOf("name", "Real News", "value", rawStats.getRealNews(), "color", "#10b981"),
                mapOf("name", "Fake News", "value", rawStats.getFakeNews(), "color", "#ef4444"));

        DashboardResponse dashboardData = DashboardResponse.builder()
                .stats(stats)
                .pieData(pieData)
                // PHASE 8: explicit null = platform-wide, matching this endpoint's
                // purpose (admin overview, not scoped to any one user).
                .activityData(adminAnalyticsService.getActivityLast7Days(null))   // FIX H-3
                .categoryData(adminAnalyticsService.getCategoryBreakdown(null))    // FIX H-3
                .recentActivity(adminAnalyticsService.getRecentActivity(null))     // FIX H-3
                .build();

        return ResponseEntity.ok(ApiResult.success(dashboardData, "Dashboard fetched successfully"));
    }

    // ==========================================
    // ANALYTICS (FIX H-2: was a dead client call /admin/analytics)
    // ==========================================
    @GetMapping("/analytics")
    public ResponseEntity<ApiResult<AdminAnalytics>> getAdminAnalytics() {
        return ResponseEntity.ok(
                ApiResult.success(adminAnalyticsService.getAnalytics(), "Analytics fetched successfully"));
    }

    // ==========================================
    // USERS LIST
    // ==========================================
    @GetMapping("/users")
    public ResponseEntity<ApiResult<Map<String, Object>>> getAllUsers() {

        List<User> users = userRepository.findAll();

        List<Map<String, Object>> formattedUsers = users.stream().map(user -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", user.getId());
            dto.put("fullName", user.getName());
            dto.put("email", user.getEmail());
            dto.put("role", user.getRole() != null ? user.getRole().toString() : "USER");
            dto.put("createdAt", user.getCreatedAt());
            dto.put("status", user.isBanned() ? "BANNED" : "ACTIVE");
            // FIX H-3: real counts (were hard-coded 0 for every user)
            dto.put("totalPredictions", predictionRepository.countByUserId(user.getId()));
            dto.put("totalNotes", noteRepository.countByUserEmail(user.getEmail()));
            return dto;
        }).toList();

        return ResponseEntity.ok(
                ApiResult.success(Map.of("users", formattedUsers), "Users fetched successfully"));
    }

    // ==========================================
    // ✅ BAN USER
    // ==========================================
    @PutMapping("/user/ban/{id}")
    public ResponseEntity<ApiResult<String>> banUser(@PathVariable String id) {
        userService.banUser(id);
        return ResponseEntity.ok(ApiResult.success("User banned successfully", "SUCCESS"));
    }

    // ==========================================
    // ✅ DELETE USER
    // ==========================================
    @DeleteMapping("/user/{id}")
    public ResponseEntity<ApiResult<String>> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResult.success("User deleted successfully", "SUCCESS"));
    }

    @PutMapping("/user/unban/{id}")
    public ResponseEntity<ApiResult<String>> unbanUser(@PathVariable String id) {
        userService.unbanUser(id);
        return ResponseEntity.ok(ApiResult.success("User unbanned successfully", "SUCCESS"));
    }

    // ==========================================
    // ✅ DELETE NOTE (FIX H-2: previously a dead client call to a missing route)
    // ==========================================
    @DeleteMapping("/notes/{id}")
    public ResponseEntity<ApiResult<String>> deleteNote(@PathVariable String id) {
        noteService.adminDeleteNote(id);
        return ResponseEntity.ok(ApiResult.success("Note deleted successfully", "SUCCESS"));
    }

    // small helper for nullable-safe ordered maps in pie data
    private Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> m = new HashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            m.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return m;
    }
}
