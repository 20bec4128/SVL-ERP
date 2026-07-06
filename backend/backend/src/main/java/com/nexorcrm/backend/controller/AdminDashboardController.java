package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.AdminDashboardResponse;
import com.nexorcrm.backend.service.AdminDashboardService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    public AdminDashboardResponse getDashboard(Authentication authentication) {
        return adminDashboardService.getDashboard(authentication.getName());
    }
}
