package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.PublicEmployeeFormResponse;
import com.nexorcrm.backend.service.EmployeeProfileFormService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/public/employee-form")
public class PublicEmployeeFormController {

    private final EmployeeProfileFormService employeeProfileFormService;

    public PublicEmployeeFormController(EmployeeProfileFormService employeeProfileFormService) {
        this.employeeProfileFormService = employeeProfileFormService;
    }

    @GetMapping("/{token}")
    public PublicEmployeeFormResponse getPublicForm(@PathVariable String token) {
        return employeeProfileFormService.getPublicForm(token);
    }

    @PostMapping(value = "/{token}/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> submit(@PathVariable String token, MultipartHttpServletRequest request) {
        return employeeProfileFormService.submitPublicForm(token, request);
    }
}
