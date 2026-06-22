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

/**
 * User-facing dashboard analytics.
 *
 * FIX C-3: this controller is no longer publicly reachable — /api/analytics/** was
 *          removed from permitAll in SecurityConfig, so a JWT is required.
 * FIX C-6: removed controller-level @CrossOrigin (CORS centralised in SecurityConfig).
 * FIX H-3: activity series and category breakdown are now real aggregates instead of
 *          total/7, total/6, … and the invented Politics/Tech/Health arithmetic split.
 *          Fabricated "+5%/-2%/+8%" stat deltas removed.
 */
@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics", description = "Dashboard analytics for users")
@SecurityRequirement(name = "Bearer Authentication")
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
                new StatCard("Total Articles Analyzed", String.valueOf(raw.getTotalPredictions()), "", "neutral"),
                new StatCard("Fake News Detected", String.valueOf(raw.getFakeNews()), "", "neutral"),
                new StatCard("Real News Verified", String.valueOf(raw.getRealNews()), "", "neutral"),
                new StatCard("Total Users", String.valueOf(raw.getTotalUsers()), "", "neutral")
        );

        // ✅ Pie (real)
        List<Map<String, Object>> pieData = new ArrayList<>();
        pieData.add(createMap("Fake", raw.getFakeNews()));
        pieData.add(createMap("Real", raw.getRealNews()));

        DashboardResponse response = DashboardResponse.builder()
                .stats(stats)
                .activityData(adminAnalyticsService.getActivityLast7Days())  // FIX H-3 (was total/7…)
                .pieData(pieData)
                .categoryData(adminAnalyticsService.getCategoryBreakdown())   // FIX H-3 (was invented)
                .recentActivity(adminAnalyticsService.getRecentActivity())    // FIX H-3 (was empty)
                .build();

        return ApiResult.success(response, "Dashboard stats retrieved");
    }

    // ✅ ANALYTICS API
    @GetMapping
    @Operation(summary = "Get analytics charts data")
    public Map<String, Object> getAnalytics() {
        return analyticsService.getAnalytics();
    }

    private Map<String, Object> createMap(String name, long value) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", name);
        map.put("value", value);
        return map;
    }
}
