package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.ChangePasswordRequest;
import com.nexorcrm.backend.dto.CompleteProfileRequest;
import com.nexorcrm.backend.dto.ForceChangePasswordRequest;
import com.nexorcrm.backend.dto.LoginRequest;
import com.nexorcrm.backend.dto.LoginResponse;
import com.nexorcrm.backend.dto.MyProfileResponse;
import com.nexorcrm.backend.dto.TokenRefreshRequest;
import com.nexorcrm.backend.dto.UpdateMyProfileRequest;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Value("${auth.refresh-cookie.name:refresh_token}")
    private String refreshCookieName;

    @Value("${auth.refresh-cookie.secure:false}")
    private boolean refreshCookieSecure;

    @Value("${auth.refresh-cookie.same-site:Lax}")
    private String refreshCookieSameSite;

    @Value("${auth.refresh-cookie.max-age-days:7}")
    private long refreshCookieMaxAgeDays;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(request);
        addRefreshCookie(response, loginResponse.getRefreshToken());
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody(required = false) TokenRefreshRequest request,
                                                      HttpServletRequest httpRequest,
                                                      HttpServletResponse response) {
        String refreshToken = resolveRefreshToken(request, httpRequest);
        LoginResponse loginResponse = authService.refreshToken(refreshToken);
        addRefreshCookie(response, loginResponse.getRefreshToken());
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiMessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                             Authentication authentication) {
        String principal = authentication.getName();
        String username = resolveUsername(principal);
        String message = authService.changePassword(username, request);
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    @PostMapping("/force-change-password")
    public ResponseEntity<ApiMessageResponse> forceChangePassword(@Valid @RequestBody ForceChangePasswordRequest request,
                                                                  Authentication authentication) {
        String message = authService.forceChangePassword(authentication.getName(), request);
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    @PostMapping("/activate")
    public ResponseEntity<ApiMessageResponse> activate(
            @RequestParam("token") String token,
            @RequestBody java.util.Map<String, String> payload) {
        String password = payload.get("password");
        String message = authService.activateCustomerAccount(token, password);
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiMessageResponse> logout(@RequestBody(required = false) TokenRefreshRequest request,
                                                     HttpServletRequest httpRequest,
                                                     HttpServletResponse response,
                                                     Authentication authentication) {
        String refreshToken = resolveRefreshToken(request, httpRequest);
        String principal = authentication == null ? null : authentication.getName();
        String message = authService.logout(refreshToken, principal);
        clearRefreshCookie(response);
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    @PostMapping("/complete-profile")
    public ResponseEntity<ApiMessageResponse> completeProfile(@Valid @RequestBody CompleteProfileRequest request,
                                                              Authentication authentication) {
        String message = authService.completeProfile(authentication.getName(), request);
        return ResponseEntity.ok(new ApiMessageResponse(message));
    }

    @GetMapping("/me")
    public ResponseEntity<MyProfileResponse> getMyProfile(Authentication authentication) {
        MyProfileResponse profile = authService.getMyProfile(authentication.getName());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<MyProfileResponse> updateMyProfile(@Valid @RequestBody UpdateMyProfileRequest request,
                                                             Authentication authentication) {
        MyProfileResponse profile = authService.updateMyProfile(authentication.getName(), request);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/profile/photo")
    public ResponseEntity<MyProfileResponse> uploadProfilePhoto(@RequestParam("file") MultipartFile file,
                                                                Authentication authentication) {
        MyProfileResponse profile = authService.uploadProfilePhoto(authentication.getName(), file);
        return ResponseEntity.ok(profile);
    }

    private String resolveUsername(String principal) {
        if (principal != null && principal.contains("@")) {
            return userRepository.findByEmail(principal.toLowerCase())
                    .map(user -> user.getUsername())
                    .orElse(principal);
        }
        return principal;
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
