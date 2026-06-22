package com.truelens.backend.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

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
}
