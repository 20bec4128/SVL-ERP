package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.AddBannedIpRequest;
import com.nexorcrm.backend.dto.AddDisallowedUsernameRequest;
import com.nexorcrm.backend.dto.RemoveBannedIpsRequest;
import com.nexorcrm.backend.dto.RemoveDisallowedUsernamesRequest;
import com.nexorcrm.backend.dto.SecuritySettingsResponse;
import com.nexorcrm.backend.service.SecuritySettingsService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/security-settings")
public class SecuritySettingsController {

    private final SecuritySettingsService securitySettingsService;

    public SecuritySettingsController(SecuritySettingsService securitySettingsService) {
        this.securitySettingsService = securitySettingsService;
    }

    @GetMapping
    public SecuritySettingsResponse getSettings(Authentication authentication) {
        return securitySettingsService.getSettings(authentication.getName());
    }

    @PostMapping("/disallowed-usernames/add")
    public SecuritySettingsResponse addDisallowedUsername(@Valid @RequestBody AddDisallowedUsernameRequest request,
                                                          Authentication authentication) {
        return securitySettingsService.addDisallowedUsername(request, authentication.getName());
    }

    @PostMapping("/disallowed-usernames/remove")
    public SecuritySettingsResponse removeDisallowedUsernames(@RequestBody RemoveDisallowedUsernamesRequest request,
                                                              Authentication authentication) {
        return securitySettingsService.removeDisallowedUsernames(request, authentication.getName());
    }

    @PostMapping("/banned-ips/add")
    public SecuritySettingsResponse addBannedIp(@Valid @RequestBody AddBannedIpRequest request,
                                                Authentication authentication) {
        return securitySettingsService.addBannedIp(request, authentication.getName());
    }

    @PostMapping("/banned-ips/remove")
    public SecuritySettingsResponse removeBannedIps(@RequestBody RemoveBannedIpsRequest request,
                                                    Authentication authentication) {
        return securitySettingsService.removeBannedIps(request, authentication.getName());
    }
}
