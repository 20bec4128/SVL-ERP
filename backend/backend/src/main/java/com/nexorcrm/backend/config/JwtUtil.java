package com.nexorcrm.backend.config;

import com.nexorcrm.backend.entity.Vendor;
import com.nexorcrm.backend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import com.nexorcrm.backend.entity.SessionSettings;
import com.nexorcrm.backend.repo.SessionSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    public static final String TOKEN_TYPE_CLAIM = "type";
    public static final String TOKEN_TYPE_USER = "USER";
    public static final String TOKEN_TYPE_VENDOR = "VENDOR";

    @Value("${security.jwt.secret:${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}}")
    private String secret;

    @Value("${auth.access-token.expiry-minutes:60}")
    private long accessTokenExpiryMinutes;

    @Autowired
    private SessionSettingsRepository sessionSettingsRepository;

    private SecretKey secretKey;

    @PostConstruct
    void init() {
        if (!StringUtils.hasText(secret)) {
            throw new IllegalStateException("JWT secret is required: security.jwt.secret / JWT_SECRET");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 256 bits (32 characters)");
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        log.info("JwtUtil initialized successfully");
    }

    public String generateAccessToken(User user, String sessionId) {
        Instant now = Instant.now();
        SessionSettings sessionSettings = sessionSettingsRepository.findAll().stream().findFirst().orElse(null);
        int timeout = sessionSettings != null ? sessionSettings.getSessionTimeoutMinutes() : 60;
        int warning = sessionSettings != null ? sessionSettings.getWarningBeforeLogoutSeconds() : 60;
        long expiryMinutes = sessionSettings != null ? sessionSettings.getSessionTimeoutMinutes() : accessTokenExpiryMinutes;

        return Jwts.builder()
                .subject(user.getEmail())
                .claim(TOKEN_TYPE_CLAIM, TOKEN_TYPE_USER)
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("forcePasswordChange", user.isForcePasswordChange())
                .claim("sessionId", sessionId)
                .claim("sessionTimeout", timeout)
                .claim("sessionWarning", warning)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expiryMinutes * 60)))
                .signWith(secretKey)
                .compact();
    }

    public String generateVendorAccessToken(Vendor vendor) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject("vendor:" + vendor.getId())
                .claim(TOKEN_TYPE_CLAIM, TOKEN_TYPE_VENDOR)
                .claim("vendorId", vendor.getId())
                .claim("username", vendor.getUsername())
                .claim("officialEmail", vendor.getOfficialEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTokenExpiryMinutes * 60)))
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public boolean validateAccessToken(String token) {
        return validateToken(token);
    }

    public Claims extractAllClaims(String token) {
        return parseClaims(token);
    }

    public String extractTokenType(String token) {
        String type = parseClaims(token).get(TOKEN_TYPE_CLAIM, String.class);
        return StringUtils.hasText(type) ? type : TOKEN_TYPE_USER;
    }

    public String extractEmail(String token) {
        return parseClaims(token).get("email", String.class);
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public Long extractVendorId(String token) {
        Object value = parseClaims(token).get("vendorId");
        if (value instanceof Number n) {
            return n.longValue();
        }
        if (value instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    public boolean extractForcePasswordChange(String token) {
        Boolean value = parseClaims(token).get("forcePasswordChange", Boolean.class);
        return Boolean.TRUE.equals(value);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
