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
    // PHASE 6: /detect/url and /detect/file do real outbound I/O (page fetch, file
    // parsing) on top of the ML call itself — tighter than plain text /detect, and
    // matches the ML service's own HEAVY_RATE_LIMIT bucket for the same routes.
    private static final int DETECT_HEAVY_MAX_PER_MINUTE = 10;
    // PHASE 7: share tokens are 24 random bytes (effectively unguessable), but a
    // generous-but-finite limit still costs an attacker real time even in the
    // astronomically unlikely event they try to brute-force one.
    private static final int PUBLIC_NOTE_MAX_PER_MINUTE = 30;
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
        if (path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/auth/forgot-password")
                || path.equals("/api/auth/resend-verification")
                || path.equals("/api/auth/reset-password")) {
            return AUTH_MAX_PER_MINUTE;
        }
        if (path.equals("/api/detect")) {
            return DETECT_MAX_PER_MINUTE;
        }
        if (path.equals("/api/detect/url") || path.equals("/api/detect/file")) {
            return DETECT_HEAVY_MAX_PER_MINUTE;
        }
        // FIX C-4: the AI chat + sentiment endpoints proxy paid inference — rate limit them too.
        if (path.equals("/api/chat") || path.equals("/api/chat/stream") || path.equals("/api/sentiment")) {
            return DETECT_MAX_PER_MINUTE;
        }
        // PHASE 7: variable {shareToken} segment, so startsWith rather than equals.
        if (path.startsWith("/api/public/notes/")) {
            return PUBLIC_NOTE_MAX_PER_MINUTE;
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
