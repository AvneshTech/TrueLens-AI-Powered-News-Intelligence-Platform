package com.truelens.backend.controller;

import com.truelens.backend.dto.AdminAnalytics;
import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.dto.DashboardResponse;
import com.truelens.backend.dto.StatCard;
import com.truelens.backend.service.AdminAnalyticsService;
import com.truelens.backend.service.AnalyticsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics", description = "Dashboard analytics for users")
@SecurityRequirement(name = "Bearer Authentication")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final AnalyticsService analyticsService;

    public AnalyticsController(AdminAnalyticsService adminAnalyticsService,
                               AnalyticsService analyticsService) {
        this.adminAnalyticsService = adminAnalyticsService;
        this.analyticsService = analyticsService;
    }

    // ✅ DASHBOARD API
    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard stats")
    public ApiResult<DashboardResponse> getDashboardStats() {

        AdminAnalytics raw = adminAnalyticsService.getAnalytics();

        List<StatCard> stats = List.of(
                new StatCard("Total Articles Analyzed", String.valueOf(raw.getTotalPredictions()), "+5%", "up"),
                new StatCard("Fake News Detected", String.valueOf(raw.getFakeNews()), "-2%", "down"),
                new StatCard("Real News Verified", String.valueOf(raw.getRealNews()), "+8%", "up"),
                new StatCard("Total Users", String.valueOf(raw.getTotalUsers()), "+12%", "up")
        );

        // ✅ Activity (safe map instead of Map.of)
        List<Map<String, Object>> activityData = new ArrayList<>();

        activityData.add(createDay("Mon", raw.getTotalPredictions() / 7));
        activityData.add(createDay("Tue", raw.getTotalPredictions() / 6));
        activityData.add(createDay("Wed", raw.getTotalPredictions() / 5));
        activityData.add(createDay("Thu", raw.getTotalPredictions() / 4));
        activityData.add(createDay("Fri", raw.getTotalPredictions() / 3));
        activityData.add(createDay("Sat", raw.getTotalPredictions() / 2));
        activityData.add(createDay("Sun", raw.getTotalPredictions()));

        // ✅ Pie
        List<Map<String, Object>> pieData = new ArrayList<>();
        pieData.add(createMap("Fake", raw.getFakeNews()));
        pieData.add(createMap("Real", raw.getRealNews()));

        // ✅ Category
        List<Map<String, Object>> categoryData = new ArrayList<>();
        categoryData.add(createCategory("Politics", raw.getFakeNews() / 2, raw.getRealNews() / 2));
        categoryData.add(createCategory("Tech", raw.getFakeNews() / 4, raw.getRealNews() / 4));
        categoryData.add(createCategory("Health", raw.getFakeNews() / 4, raw.getRealNews() / 4));

        DashboardResponse response = DashboardResponse.builder()
                .stats(stats)
                .activityData(activityData)
                .pieData(pieData)
                .categoryData(categoryData)
                .recentActivity(List.of())
                .build();

        return ApiResult.success(response, "Dashboard stats retrieved");
    }

    // ✅ ANALYTICS API
    @GetMapping
    @Operation(summary = "Get analytics charts data")
    public Map<String, Object> getAnalytics() {
        return analyticsService.getAnalytics();
    }

    // 🔥 Helper Methods (clean + reusable)

    private Map<String, Object> createDay(String name, long value) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("value", value);
        return map;
    }

    private Map<String, Object> createMap(String name, long value) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("value", value);
        return map;
    }

    private Map<String, Object> createCategory(String name, long fake, long real) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("fake", fake);
        map.put("real", real);
        return map;
    }
}