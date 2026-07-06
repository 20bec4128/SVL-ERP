package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.UserDesignationRequest;
import com.nexorcrm.backend.entity.UserDesignation;
import com.nexorcrm.backend.service.UserDesignationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-designations")
public class UserDesignationController {

    private final UserDesignationService userDesignationService;

    public UserDesignationController(UserDesignationService userDesignationService) {
        this.userDesignationService = userDesignationService;
    }

    @GetMapping
    public List<UserDesignation> getDesignations(@RequestParam(value = "userDepartmentId", required = false) Long userDepartmentId) {
        return userDesignationService.getDesignations(userDepartmentId);
    }

    @PostMapping
    public UserDesignation createDesignation(@Valid @RequestBody UserDesignationRequest request) {
        return userDesignationService.createDesignation(request);
    }

    @PutMapping("/{id}")
    public UserDesignation updateDesignation(@PathVariable Long id, @Valid @RequestBody UserDesignationRequest request) {
        return userDesignationService.updateDesignation(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteDesignation(@PathVariable Long id) {
        userDesignationService.deleteDesignation(id);
    }
}
