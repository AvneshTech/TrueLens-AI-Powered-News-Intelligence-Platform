package com.truelens.backend.controller;

import com.truelens.backend.dto.AdminAnalytics;
import com.truelens.backend.dto.ApiResult;
import com.truelens.backend.dto.DashboardResponse;
import com.truelens.backend.dto.StatCard;
import com.truelens.backend.model.User;
import com.truelens.backend.service.AdminAnalyticsService;
import com.truelens.backend.service.AnalyticsService;
import com.truelens.backend.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.core.Authentication;
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
 * PHASE 8: every figure here is now scoped to the authenticated user. Previously this
 *          endpoint called the same platform-wide aggregates as the admin dashboard
 *          (AdminAnalyticsService.getAnalytics()/getActivityLast7Days()/etc with no
 *          user filter) — every regular user's "personal" dashboard was actually
 *          showing every user's combined totals and recent activity, including other
 *          users' article titles in the recent-activity feed.
 */
@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics", description = "Dashboard analytics for users")
@SecurityRequirement(name = "Bearer Authentication")
public class AnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final AnalyticsService analyticsService;
    private final UserService userService;

    public AnalyticsController(AdminAnalyticsService adminAnalyticsService,
                               AnalyticsService analyticsService,
                               UserService userService) {
        this.adminAnalyticsService = adminAnalyticsService;
        this.analyticsService = analyticsService;
        this.userService = userService;
    }

    // ✅ DASHBOARD API
    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard stats")
    public ApiResult<DashboardResponse> getDashboardStats(Authentication auth) {

        User user = userService.findByEmail(auth.getName());
        String userId = user.getId();

        AdminAnalytics raw = adminAnalyticsService.getAnalyticsForUser(userId);

        // PHASE 8: "Total Users" removed from this card set — it's a platform-wide
        // figure with no per-user meaning, and showing it on someone's personal
        // dashboard (next to numbers that are now genuinely theirs) was misleading.
        // It remains on the admin dashboard (AdminController), where it belongs.
        List<StatCard> stats = List.of(
                new StatCard("Total Articles Analyzed", String.valueOf(raw.getTotalPredictions()), "", "neutral"),
                new StatCard("Fake News Detected", String.valueOf(raw.getFakeNews()), "", "neutral"),
                new StatCard("Real News Verified", String.valueOf(raw.getRealNews()), "", "neutral")
        );

        // ✅ Pie (real, scoped to this user)
        List<Map<String, Object>> pieData = new ArrayList<>();
        pieData.add(createMap("Fake", raw.getFakeNews()));
        pieData.add(createMap("Real", raw.getRealNews()));

        DashboardResponse response = DashboardResponse.builder()
                .stats(stats)
                .activityData(adminAnalyticsService.getActivityLast7Days(userId))  // FIX H-3 + PHASE 8
                .pieData(pieData)
                .categoryData(adminAnalyticsService.getCategoryBreakdown(userId))   // FIX H-3 + PHASE 8
                .recentActivity(adminAnalyticsService.getRecentActivity(userId))    // FIX H-3 + PHASE 8
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
