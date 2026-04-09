package com.truelens.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private List<StatCard> stats;

    // ✅ FIXED TYPES
    private List<Map<String, Object>> activityData;
    private List<Map<String, Object>> pieData;
    private List<Map<String, Object>> categoryData;
    private List<Map<String, Object>> recentActivity;
}