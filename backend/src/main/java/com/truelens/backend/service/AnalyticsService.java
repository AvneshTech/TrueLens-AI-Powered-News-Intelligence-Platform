package com.truelens.backend.service;

import com.truelens.backend.model.PredictionResult;
import com.truelens.backend.repository.PredictionHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Month;
import java.util.*;

@Service
public class AnalyticsService {

    @Autowired
    private PredictionHistoryRepository repo;

    public Map<String, Object> getAnalytics() {

        Map<String, Object> res = new HashMap<>();

        long total = repo.count();
        long fake = repo.countByResult(PredictionResult.FAKE);
        long real = repo.countByResult(PredictionResult.REAL);

        // ✅ PIE
        res.put("distribution", List.of(
                Map.of("name", "Real", "value", real),
                Map.of("name", "Fake", "value", fake)
        ));

        // ✅ MONTHLY (REAL SPLIT)
        Map<Integer, Map<String, Long>> monthMap = new HashMap<>();

        for (Object[] row : repo.countByMonthAndResult()) {
            int month = ((Number) row[0]).intValue();
            PredictionResult result = (PredictionResult) row[1];
            long count = ((Number) row[2]).longValue();

            monthMap.putIfAbsent(month, new HashMap<>());
            monthMap.get(month).put(result.name(), count);
        }

        List<Map<String, Object>> monthly = new ArrayList<>();

        for (int m = 1; m <= 12; m++) {
            Map<String, Long> data = monthMap.getOrDefault(m, new HashMap<>());

            long realCount = data.getOrDefault("REAL", 0L);
            long fakeCount = data.getOrDefault("FAKE", 0L);

            Map<String, Object> map = new HashMap<>();
            map.put("month", getMonth(m));
            map.put("real", realCount);
            map.put("fake", fakeCount);
            map.put("total", realCount + fakeCount);

            monthly.add(map);
        }

        res.put("monthly", monthly);

        // ✅ DAILY
        List<Map<String, Object>> daily = new ArrayList<>();

        for (Object[] r : repo.countLast7Days()) {
            int day = ((Number) r[0]).intValue();
            long count = ((Number) r[1]).longValue();

            Map<String, Object> map = new HashMap<>();
            map.put("day", getDay(day));
            map.put("analyses", count);

            daily.add(map);
        }

        res.put("daily", daily);

        // ✅ CATEGORY
        List<Map<String, Object>> category = new ArrayList<>();
        Map<String, Object> cat = new HashMap<>();
        cat.put("category", "General");
        cat.put("accuracy", calculateAccuracy(real, total));
        category.add(cat);

        res.put("category", category);

        // ✅ RADAR
        Double avg = repo.averageConfidence();
        int confidence = avg != null ? avg.intValue() : 0;

        List<Map<String, Object>> accuracy = new ArrayList<>();

        Map<String, Object> a1 = new HashMap<>();
        a1.put("subject", "Prediction Accuracy");
        a1.put("A", calculateAccuracy(real, total));

        Map<String, Object> a2 = new HashMap<>();
        a2.put("subject", "Confidence Avg");
        a2.put("A", confidence);

        accuracy.add(a1);
        accuracy.add(a2);

        res.put("accuracy", accuracy);

        // ✅ STATS
        List<Map<String, Object>> stats = new ArrayList<>();

        stats.add(createStat("Total", total));
        stats.add(createStat("Fake", fake));
        stats.add(createStat("Real", real));

        res.put("stats", stats);

        return res;
    }

    private Map<String, Object> createStat(String title, long value) {
        Map<String, Object> map = new HashMap<>();
        map.put("title", title);
        map.put("value", value);
        map.put("change", "+0%");
        return map;
    }

    private String getMonth(int m) {
        return Month.of(m).name().substring(0, 3);
    }

    private String getDay(int d) {
        String[] days = {"Sun","Mon","Tue","Wed","Thu","Fri","Sat"};
        return days[d - 1];
    }

    private int calculateAccuracy(long real, long total) {
        if (total == 0) return 0;
        return (int) ((real * 100.0) / total);
    }
}