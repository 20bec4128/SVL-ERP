package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.EmployeeRequest;
import com.nexorcrm.backend.dto.EmployeeResponse;
import com.nexorcrm.backend.dto.EmployeeOnboardRequest;
import com.nexorcrm.backend.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import org.springframework.core.io.Resource;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public Object list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long designationId,
            @RequestParam(required = false) String profileStatus,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort
    ) {
        boolean pagedRequest = page != null || size != null
                || headOfficeId != null || branchId != null || departmentId != null || designationId != null
                || (profileStatus != null && !profileStatus.isBlank())
                || (q != null && !q.isBlank())
                || (sort != null && !sort.isBlank());
        if (!pagedRequest) {
            return employeeService.list();
        }

        String sortField = "id";
        String sortOrder = "desc";
        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",");
            sortField = parts[0];
            if (parts.length > 1) {
                sortOrder = parts[1];
            }
        }
        return employeeService.list(page, size, headOfficeId, branchId, departmentId, designationId, profileStatus, q, sortField, sortOrder);
    }

    @GetMapping("/available")
    public List<EmployeeResponse> getAvailableEmployees(
            @RequestParam(required = false) Long headOfficeId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long designationId,
            @RequestParam(required = false) String institution,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String team
    ) {
        return employeeService.getAvailableEmployees(
                headOfficeId,
                branchId,
                departmentId,
                designationId,
                institution,
                department,
                team
        );
    }

    @PostMapping
    public EmployeeResponse create(@Valid @RequestBody EmployeeRequest request) {
        return employeeService.create(request);
    }

    @PostMapping(value = "/onboard", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EmployeeResponse onboard(@ModelAttribute EmployeeOnboardRequest request) {
        return employeeService.onboard(request);
    }

    @GetMapping("/{id}")
    public EmployeeResponse getById(@PathVariable Long id) {
        return employeeService.getById(id);
    }

    @GetMapping("/{id}/files/{fileKey}")
    public ResponseEntity<Resource> viewFile(@PathVariable Long id, @PathVariable String fileKey) {
        return employeeService.getFile(id, fileKey);
    }

    @PutMapping(value = "/{id}/onboard", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EmployeeResponse onboardUpdate(@PathVariable Long id, @ModelAttribute EmployeeOnboardRequest request) {
        return employeeService.onboardUpdate(id, request);
    }

    @PutMapping("/{id}")
    public EmployeeResponse update(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return employeeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        employeeService.delete(id);
    }
}
