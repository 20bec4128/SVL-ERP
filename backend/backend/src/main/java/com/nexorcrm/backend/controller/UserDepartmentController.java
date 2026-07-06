package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.UserDepartmentRequest;
import com.nexorcrm.backend.entity.UserDepartment;
import com.nexorcrm.backend.service.UserDepartmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-departments")
public class UserDepartmentController {

    private final UserDepartmentService userDepartmentService;

    public UserDepartmentController(UserDepartmentService userDepartmentService) {
        this.userDepartmentService = userDepartmentService;
    }

    @GetMapping
    public List<UserDepartment> getDepartments(@RequestParam(value = "branchId", required = false) Long branchId) {
        return userDepartmentService.getDepartments(branchId);
    }

    @PostMapping
    public UserDepartment createDepartment(@Valid @RequestBody UserDepartmentRequest request) {
        return userDepartmentService.createDepartment(request);
    }

    @PutMapping("/{id}")
    public UserDepartment updateDepartment(@PathVariable Long id, @Valid @RequestBody UserDepartmentRequest request) {
        return userDepartmentService.updateDepartment(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteDepartment(@PathVariable Long id) {
        userDepartmentService.deleteDepartment(id);
    }
}
