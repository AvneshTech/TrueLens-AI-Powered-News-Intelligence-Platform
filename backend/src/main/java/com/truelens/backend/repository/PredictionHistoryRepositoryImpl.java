package com.truelens.backend.repository;

import com.truelens.backend.model.PredictionResult;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.DateOperators;
import org.springframework.data.mongodb.core.query.Criteria;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

/**
 * PHASE 2: MongoTemplate aggregation pipelines replacing the old JPQL
 * FUNCTION('MONTH', …) queries and the native DAYOFWEEK(...) / INTERVAL 7 DAY query.
 *
 * NOTE: $month and $dayOfWeek in MongoDB return the same numbering MySQL did
 * (month 1–12; dayOfWeek 1=Sunday … 7=Saturday), so the existing getDay()/getMonth()
 * mappers in the services continue to work without change.
 */
public class PredictionHistoryRepositoryImpl implements PredictionHistoryRepositoryCustom {

    private static final String COLLECTION = "prediction_history";

    private final MongoTemplate mongoTemplate;

    public PredictionHistoryRepositoryImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<Object[]> countByMonth() {
        Aggregation agg = newAggregation(
                project().and(DateOperators.Month.monthOf("createdAt")).as("month"),
                group("month").count().as("count"),
                sort(org.springframework.data.domain.Sort.Direction.ASC, "_id")
        );

        List<Object[]> out = new ArrayList<>();
        for (Document d : run(agg)) {
            int month = ((Number) d.get("_id")).intValue();
            long count = ((Number) d.get("count")).longValue();
            out.add(new Object[]{month, count});
        }
        return out;
    }

    @Override
    public List<Object[]> countByMonthAndResult() {
        Aggregation agg = newAggregation(
                project()
                        .and(DateOperators.Month.monthOf("createdAt")).as("month")
                        .and("result").as("result"),
                group("month", "result").count().as("count")
        );

        List<Object[]> out = new ArrayList<>();
        for (Document d : run(agg)) {
            Document id = (Document) d.get("_id");
            int month = ((Number) id.get("month")).intValue();
            PredictionResult result = toResult(id.get("result"));
            long count = ((Number) d.get("count")).longValue();
            out.add(new Object[]{month, result, count});
        }
        return out;
    }

    @Override
    public List<Object[]> countLast7Days() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);

        Aggregation agg = newAggregation(
                match(Criteria.where("createdAt").gte(cutoff)),
                project().and(DateOperators.DayOfWeek.dayOfWeek("createdAt")).as("dow"),
                group("dow").count().as("count")
        );

        List<Object[]> out = new ArrayList<>();
        for (Document d : run(agg)) {
            int dow = ((Number) d.get("_id")).intValue();
            long count = ((Number) d.get("count")).longValue();
            out.add(new Object[]{dow, count});
        }
        return out;
    }

    @Override
    public Double averageConfidence() {
        Aggregation agg = newAggregation(
                group().avg("confidence").as("avg")
        );

        for (Document d : run(agg)) {
            Object avg = d.get("avg");
            return avg != null ? ((Number) avg).doubleValue() : null;
        }
        return null;
    }

    @Override
    public List<Object[]> countByCategoryAndResult() {
        Aggregation agg = newAggregation(
                group("category", "result").count().as("count")
        );

        List<Object[]> out = new ArrayList<>();
        for (Document d : run(agg)) {
            Document id = (Document) d.get("_id");
            Object category = id != null ? id.get("category") : null;
            PredictionResult result = toResult(id != null ? id.get("result") : null);
            long count = ((Number) d.get("count")).longValue();
            out.add(new Object[]{category, result, count});
        }
        return out;
    }

    // PHASE 8: user-scoped variants — identical pipelines to countLast7Days() /
    // countByCategoryAndResult() above, with a $match stage on userId prepended so
    // a regular user's dashboard reflects their own activity, not every user's.
    @Override
    public List<Object[]> countLast7DaysForUser(String userId) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);

        Aggregation agg = newAggregation(
                match(Criteria.where("userId").is(userId).and("createdAt").gte(cutoff)),
                project().and(DateOperators.DayOfWeek.dayOfWeek("createdAt")).as("dow"),
                group("dow").count().as("count")
        );

        List<Object[]> out = new ArrayList<>();
        for (Document d : run(agg)) {
            int dow = ((Number) d.get("_id")).intValue();
            long count = ((Number) d.get("count")).longValue();
            out.add(new Object[]{dow, count});
        }
        return out;
    }

    @Override
    public List<Object[]> countByCategoryAndResultForUser(String userId) {
        Aggregation agg = newAggregation(
                match(Criteria.where("userId").is(userId)),
                group("category", "result").count().as("count")
        );

        List<Object[]> out = new ArrayList<>();
        for (Document d : run(agg)) {
            Document id = (Document) d.get("_id");
            Object category = id != null ? id.get("category") : null;
            PredictionResult result = toResult(id != null ? id.get("result") : null);
            long count = ((Number) d.get("count")).longValue();
            out.add(new Object[]{category, result, count});
        }
        return out;
    }

    // ── helpers ──────────────────────────────────────────────────────────────
    private List<Document> run(Aggregation agg) {
        AggregationResults<Document> results =
                mongoTemplate.aggregate(agg, COLLECTION, Document.class);
        return results.getMappedResults();
    }

    private PredictionResult toResult(Object raw) {
        if (raw == null) return null;
        try {
            return PredictionResult.valueOf(String.valueOf(raw));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
