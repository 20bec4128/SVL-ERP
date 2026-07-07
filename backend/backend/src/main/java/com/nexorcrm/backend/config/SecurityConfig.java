package com.nexorcrm.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {


    private final JwtFilter jwtFilter;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend.url:${FRONTEND_URL:http://localhost:5173}}")
    private String frontendUrl;

    public SecurityConfig(JwtFilter jwtFilter, ObjectMapper objectMapper) {
        this.jwtFilter = jwtFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        // Allow the frontend (separate origin) to embed preview iframes for uploaded documents.
                        // We rely on CSP `frame-ancestors` instead of X-Frame-Options (which cannot express multiple origins in modern browsers).
                        .frameOptions(frame -> frame.disable())
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "frame-ancestors 'self' " + frontendUrl + " http://localhost:5173 http://127.0.0.1:5173"
                        ))
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            Map<String, Object> body = Map.of(
                                    "status", 401,
                                    "error", "Unauthorized",
                                    "message", authException.getMessage(),
                                    "timestamp", LocalDateTime.now().toString()
                             );
                            response.getWriter().write(objectMapper.writeValueAsString(body));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            Map<String, Object> body = Map.of(
                                    "status", 403,
                                    "error", "Forbidden",
                                    "message", "Access denied",
                                    "timestamp", LocalDateTime.now().toString()
                            );
                            try {
                                response.getWriter().write(objectMapper.writeValueAsString(body));
                            } catch (Exception e) {
                                // ignore
                            }
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/refresh").permitAll()
                        .requestMatchers("/api/v1/webhook/meta", "/api/v1/webhook/incoming-lead").permitAll()
                        .requestMatchers("/api/v1/campaign-leads/incoming-lead").permitAll()
                        .requestMatchers("/api/vendor-auth/login", "/api/vendor-auth/refresh", "/api/vendor-auth/logout").permitAll()
                        .requestMatchers("/api/recovery/**").permitAll()
                        .requestMatchers("/api/policies/*/file").permitAll()
                        .requestMatchers("/api/public/employee-form/**").permitAll()
                        .requestMatchers("/uploads/**", "/api/uploads/**").permitAll()
                        .requestMatchers("/api/payments/webhook").permitAll()

                        .requestMatchers("/api/settings/mail/**", "/api/settings/mail").hasAnyRole("SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE")
                        .requestMatchers("/api/settings/registration", "/api/settings/session", "/api/settings/user", "/api/settings/security-policy").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/settings/**").hasRole("SUPER_ADMIN")
                        // Vendor portal endpoints should be accessible to vendor accounts, but these endpoints are also used
                        // by staff screens. Keep both authorized.
                        .requestMatchers("/api/vendor-orders/**").hasAnyRole("VENDOR", "SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE")
                        .requestMatchers("/api/customer/**").hasRole("CUSTOMER")
                        .requestMatchers("/api/superadmin/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/api/manager/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MANAGER")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                frontendUrl,
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://[::1]:*"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Set-Cookie", "Authorization"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
