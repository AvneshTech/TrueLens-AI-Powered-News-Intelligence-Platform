package com.truelens.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Central application-level bean declarations.
 *
 * RestTemplate is declared here as a singleton bean (Fix #8) so it is shared
 * across the application, enabling connection pooling and uniform timeout config.
 */
@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
