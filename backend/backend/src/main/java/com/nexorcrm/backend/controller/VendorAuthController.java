package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.TokenRefreshRequest;
import com.nexorcrm.backend.dto.VendorLoginRequest;
import com.nexorcrm.backend.dto.VendorLoginResponse;
import com.nexorcrm.backend.service.VendorAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendor-auth")
public class VendorAuthController {

    private final VendorAuthService vendorAuthService;

    @Value("${auth.vendor.refresh-cookie.name:vendor_refresh_token}")
    private String refreshCookieName;

    @Value("${auth.vendor.refresh-cookie.secure:false}")
    private boolean refreshCookieSecure;

    @Value("${auth.vendor.refresh-cookie.same-site:Lax}")
    private String refreshCookieSameSite;

    @Value("${auth.vendor.refresh-cookie.max-age-days:7}")
    private long refreshCookieMaxAgeDays;

    public VendorAuthController(VendorAuthService vendorAuthService) {
        this.vendorAuthService = vendorAuthService;
    }

    @PostMapping("/login")
    public ResponseEntity<VendorLoginResponse> login(@Valid @RequestBody VendorLoginRequest request,
                                                     HttpServletResponse response) {
        VendorLoginResponse loginResponse = vendorAuthService.login(request);
        addRefreshCookie(response, loginResponse.getRefreshToken());
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<VendorLoginResponse> refreshToken(@RequestBody(required = false) TokenRefreshRequest request,
                                                            HttpServletRequest httpRequest,
                                                            HttpServletResponse response) {
        String refreshToken = resolveRefreshToken(request, httpRequest);
        VendorLoginResponse refreshResponse = vendorAuthService.refreshToken(refreshToken);
        addRefreshCookie(response, refreshResponse.getRefreshToken());
        return ResponseEntity.ok(refreshResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiMessageResponse> logout(@RequestBody(required = false) TokenRefreshRequest request,
                                                     HttpServletRequest httpRequest,
                                                     HttpServletResponse response) {
        String refreshToken = resolveRefreshToken(request, httpRequest);
        String message = vendorAuthService.logout(refreshToken);
        clearRefreshCookie(response);
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    private String resolveRefreshToken(TokenRefreshRequest request, HttpServletRequest httpRequest) {
        if (request != null && StringUtils.hasText(request.getRefreshToken())) {
            return request.getRefreshToken();
        }
        Cookie[] cookies = httpRequest.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (refreshCookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private void addRefreshCookie(HttpServletResponse response, String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            return;
        }
        ResponseCookie cookie = ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path("/")
                .sameSite(refreshCookieSameSite)
                .maxAge(refreshCookieMaxAgeDays * 24 * 60 * 60)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(refreshCookieName, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path("/")
                .sameSite(refreshCookieSameSite)
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

}
