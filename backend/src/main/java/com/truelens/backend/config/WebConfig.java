
package com.truelens.backend.config;

import org.springframework.context.annotation.Configuration;

/**
 * FIX #16: WebConfig previously defined its own CORS mapping via addCorsMappings(),
 * which conflicted with the CorsConfigurationSource bean in SecurityConfig.
 *
 * Having two CORS configurations is dangerous: they can produce inconsistent
 * behaviour depending on filter chain ordering, and WebConfig was allowing
 * allowedMethods("*") while SecurityConfig restricted to a specific list.
 *
 * Resolution: all CORS rules are now centralised in SecurityConfig.corsConfigurationSource().
 * This class is kept as a placeholder so the package structure stays intact.
 */
@Configuration
public class WebConfig {
    // CORS is configured centrally in SecurityConfig.corsConfigurationSource()
}

