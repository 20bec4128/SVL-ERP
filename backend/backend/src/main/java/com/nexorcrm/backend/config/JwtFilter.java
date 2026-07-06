package com.nexorcrm.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.Vendor;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.repo.VendorRepository;
import com.nexorcrm.backend.repo.RefreshTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.nexorcrm.backend.service.SecuritySettingsService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SecuritySettingsService securitySettingsService;
    private final ObjectMapper objectMapper;

    public JwtFilter(JwtUtil jwtUtil, UserRepository userRepository, VendorRepository vendorRepository, RefreshTokenRepository refreshTokenRepository, SecuritySettingsService securitySettingsService, ObjectMapper objectMapper) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.vendorRepository = vendorRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.securitySettingsService = securitySettingsService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String loginIp = resolveIpAddress(request);
        if (securitySettingsService.isIpBanned(loginIp)) {
            writeForbidden(response, "Access is blocked from this IP address");
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateAccessToken(token)) {
            // Allow the request to proceed. If it's a secured route, Spring Security will block it.
            // If it's a public route (like login/refresh), it will succeed.
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String tokenType = jwtUtil.extractTokenType(token);
            UsernamePasswordAuthenticationToken authentication;
            if (JwtUtil.TOKEN_TYPE_VENDOR.equalsIgnoreCase(tokenType)) {
                Long vendorId = jwtUtil.extractVendorId(token);
                if (vendorId == null) {
                    writeUnauthorized(response, "Vendor not found for token");
                    return;
                }
                Vendor vendor = vendorRepository.findById(vendorId).orElse(null);
                if (vendor == null || vendor.isDeleted()) {
                    writeUnauthorized(response, "Vendor not found for token");
                    return;
                }
                authentication = new UsernamePasswordAuthenticationToken(
                        vendor.getUsername(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_VENDOR"))
                );
            } else {
                String email = jwtUtil.extractEmail(token);
                User user = userRepository.findByEmailAndIsDeletedFalse(email).orElse(null);
                if (user == null) {
                    writeUnauthorized(response, "User not found for token");
                    return;
                }

                String sessionId = jwtUtil.extractAllClaims(token).get("sessionId", String.class);
                if (sessionId != null) {
                    boolean sessionValid = refreshTokenRepository.findByToken(sessionId)
                            .map(rt -> !rt.isRevoked() && rt.getExpiryDate().isAfter(LocalDateTime.now()))
                            .orElse(false);
                    if (!sessionValid) {
                        writeUnauthorized(response, "Session has been invalidated due to concurrent login");
                        return;
                    }
                }

                authentication = new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                );
            }
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = Map.of(
                "status", 401,
                "error", "Unauthorized",
                "message", message,
                "timestamp", LocalDateTime.now().toString()
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private void writeForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = Map.of(
                "status", 403,
                "error", "Forbidden",
                "message", message,
                "timestamp", LocalDateTime.now().toString()
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private String resolveIpAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (org.springframework.util.StringUtils.hasText(forwarded)) {
            int comma = forwarded.indexOf(',');
            return comma > -1 ? forwarded.substring(0, comma).trim() : forwarded.trim();
        }
        return request.getRemoteAddr();
    }
}
