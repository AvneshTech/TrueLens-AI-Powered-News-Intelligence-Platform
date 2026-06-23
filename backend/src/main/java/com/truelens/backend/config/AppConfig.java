package com.truelens.backend.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Central application-level bean declarations.
 *
 * RestTemplate is declared here as a singleton bean (Fix #8) so it is shared
 * across the application, enabling connection pooling and uniform timeout config.
 *
 * FIX M-12: connect/read timeouts added so a slow upstream (ML service, Hugging
 * Face, NewsAPI) can no longer stall Tomcat worker threads indefinitely.
 */
@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(20))
                .build();
    }

    /**
     * PHASE 5: dedicated pool for streaming chat completions.
     *
     * The SSE endpoint hands the (blocking, long-lived) provider call off to this
     * executor immediately so the Tomcat request thread is freed right away — a
     * 30-second streamed reply would otherwise pin a worker thread for its duration.
     * Bounded size keeps a burst of concurrent chats from exhausting memory; this is
     * a plain pool (not virtual threads) since the project targets Java 17.
     */
    @Bean
    public Executor chatStreamingExecutor() {
        return Executors.newFixedThreadPool(16);
    }
}
