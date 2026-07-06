package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.EmployeeDashboardResponse;
import com.nexorcrm.backend.service.EmployeeDashboardService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employee/dashboard")
public class EmployeeDashboardController {

    private final EmployeeDashboardService employeeDashboardService;

    public EmployeeDashboardController(EmployeeDashboardService employeeDashboardService) {
        this.employeeDashboardService = employeeDashboardService;
    }

    @GetMapping
    public EmployeeDashboardResponse getDashboard(Authentication authentication) {
        return employeeDashboardService.getDashboard(authentication.getName());
    }
}
