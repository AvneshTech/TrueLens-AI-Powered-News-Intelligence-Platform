package com.truelens.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springdoc.core.models.GroupedOpenApi;

/**
 * OpenAPI/Swagger Configuration for comprehensive API documentation
 * Accessible at: http://localhost:8080/swagger-ui.html
 * API Docs: http://localhost:8080/v3/api-docs
 */

@Configuration
public class OpenApiConfig {

        @Bean
        public OpenAPI customOpenAPI() {
                return new OpenAPI()
                                .info(new Info()
                                                .title("TrueLens Backend API")
                                                .version("1.0.0")
                                                .description("Comprehensive API documentation for TrueLens - Fake News Detection Backend")
                                                .contact(new Contact()
                                                                .name("TrueLens Development Team")
                                                                .email("dev@truelens.example.com")
                                                                .url("https://github.com/truelens"))
                                                .license(new License()
                                                                .name("Apache 2.0")
                                                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                                .components(new Components()
                                                .addSecuritySchemes("Bearer Authentication",
                                                                new SecurityScheme()
                                                                                .type(SecurityScheme.Type.HTTP)
                                                                                .scheme("bearer")
                                                                                .bearerFormat("JWT")
                                                                                .description("JWT Bearer token for API authentication. "
                                                                                                +
                                                                                                "Obtain token from /api/auth/login endpoint")));
        }

        @Bean
        public GroupedOpenApi publicApi() {
                return GroupedOpenApi.builder()
                                .group("public-api")
                                .pathsToMatch("/api/**")
                                .packagesToExclude(
                                                "org.springframework",
                                                "org.springdoc",
                                                "org.springframework.data",
                                                "jakarta",
                                                "java.util",
                                                "java.time")
                                .build();
        }
}