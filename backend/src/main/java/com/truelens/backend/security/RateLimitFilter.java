package com.truelens.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * FIX #5: Rate limiting on sensitive endpoints.
 *
 * Without this, /api/auth/login could be brute-forced, /api/auth/register
 * spammed for account creation, and /api/detect abused for free ML inference.
 *
 * Strategy: sliding window per IP per endpoint bucket.
 *   - Login / Register: max 10 requests per minute per IP
 *   - Detect:           max 20 requests per minute per IP
 *
 * For production with multiple instances, replace the ConcurrentHashMap
 * with a Redis-backed counter (e.g. using Bucket4j + Redis).
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int AUTH_MAX_PER_MINUTE   = 10;
    private static final int DETECT_MAX_PER_MINUTE = 20;
    private static final long WINDOW_MS             = 60_000L;

    // Key: "ip:path-bucket"  →  [count, windowStart]
    private final Map<String, long[]> counters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain) throws ServletException, IOException {

        String path = request.getServletPath();
        int limit = resolveLimit(path);

        if (limit > 0) {
            String ip = getClientIp(request);
            String bucket = ip + ":" + path;
            long now = Instant.now().toEpochMilli();

            long[] state = counters.compute(bucket, (k, v) -> {
                if (v == null || now - v[1] > WINDOW_MS) {
                    return new long[]{1, now};   // new window
                }
                v[0]++;
                return v;
            });

            if (state[0] > limit) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"success\":false,\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private int resolveLimit(String path) {
        if (path.equals("/api/auth/login") || path.equals("/api/auth/register")) {
            return AUTH_MAX_PER_MINUTE;
        }
        if (path.equals("/api/detect")) {
            return DETECT_MAX_PER_MINUTE;
        }
        return 0; // no limit on other paths
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
