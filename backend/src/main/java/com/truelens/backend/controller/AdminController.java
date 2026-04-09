package com.truelens.backend.controller;

import com.truelens.backend.dto.*;
import com.truelens.backend.model.User;
import com.truelens.backend.repository.UserRepository;
import com.truelens.backend.service.AdminAnalyticsService;
import com.truelens.backend.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final UserRepository userRepository;
    private final UserService userService; // ✅ ADD THIS

    public AdminController(AdminAnalyticsService adminAnalyticsService,
            UserRepository userRepository,
            UserService userService) { // ✅ ADD THIS
        this.adminAnalyticsService = adminAnalyticsService;
        this.userRepository = userRepository;
        this.userService = userService; // ✅ ADD THIS
    }

    // ==========================================
    // DASHBOARD
    // ==========================================
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResult<DashboardResponse>> getAdminDashboard() {

        AdminAnalytics rawStats = adminAnalyticsService.getAnalytics();

        List<StatCard> stats = List.of(
                new StatCard("Total Users", String.valueOf(rawStats.getTotalUsers()), "+12%", "up"),
                new StatCard("Total Articles Analyzed", String.valueOf(rawStats.getTotalPredictions()), "+5%", "up"),
                new StatCard("Fake News Detected", String.valueOf(rawStats.getFakeNews()), "-2%", "down"),
                new StatCard("Real News Verified", String.valueOf(rawStats.getRealNews()), "+8%", "up"));

        List<Map<String, Object>> pieData = List.of(
                Map.of("name", "Real News", "value", rawStats.getRealNews(), "color", "#10b981"),
                Map.of("name", "Fake News", "value", rawStats.getFakeNews(), "color", "#ef4444"));

        DashboardResponse dashboardData = DashboardResponse.builder()
                .stats(stats)
                .pieData(pieData)
                .activityData(List.of())
                .categoryData(List.of())
                .recentActivity(List.of())
                .build();

        return ResponseEntity.ok(ApiResult.success(dashboardData, "Dashboard fetched successfully"));
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
            dto.put("totalPredictions", 0);
            dto.put("totalNotes", 0);
            return dto;
        }).toList();

        return ResponseEntity.ok(
                ApiResult.success(Map.of("users", formattedUsers), "Users fetched successfully"));
    }

    // ==========================================
    // ✅ BAN USER
    // ==========================================
    @PutMapping("/user/ban/{id}")
    public ResponseEntity<ApiResult<String>> banUser(@PathVariable Long id) {

        userService.banUser(id);

        return ResponseEntity.ok(
                ApiResult.success("User banned successfully", "SUCCESS"));
    }

    // ==========================================
    // ✅ DELETE USER
    // ==========================================
    @DeleteMapping("/user/{id}")
    public ResponseEntity<ApiResult<String>> deleteUser(@PathVariable Long id) {

        userService.deleteUser(id);

        return ResponseEntity.ok(
                ApiResult.success("User deleted successfully", "SUCCESS"));
    }

    @PutMapping("/user/unban/{id}")
    public ResponseEntity<ApiResult<String>> unbanUser(@PathVariable Long id) {

        userService.unbanUser(id);

        return ResponseEntity.ok(
                ApiResult.success("User unbanned successfully", "SUCCESS"));
    }
}