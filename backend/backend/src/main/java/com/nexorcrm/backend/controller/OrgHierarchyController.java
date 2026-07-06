package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.CreateDepartmentRequest;
import com.nexorcrm.backend.dto.CreateInstitutionRequest;
import com.nexorcrm.backend.dto.CreateTeamRequest;
import com.nexorcrm.backend.dto.OrgOptionResponse;
import com.nexorcrm.backend.dto.OrgSelectionResponse;
import com.nexorcrm.backend.service.OrgHierarchyService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org")
public class OrgHierarchyController {

    private final OrgHierarchyService service;

    public OrgHierarchyController(OrgHierarchyService service) {
        this.service = service;
    }

    @GetMapping("/institutions")
    public List<OrgOptionResponse> listInstitutions() {
        return service.listInstitutions();
    }

    @PostMapping("/institutions")
    public OrgOptionResponse addInstitution(@Valid @RequestBody CreateInstitutionRequest request, Authentication auth) {
        return service.addInstitution(request, auth.getName());
    }

    @GetMapping("/departments")
    public List<OrgOptionResponse> listDepartments(@RequestParam Long institutionId) {
        return service.listDepartments(institutionId);
    }

    @PostMapping("/departments")
    public OrgOptionResponse addDepartment(@Valid @RequestBody CreateDepartmentRequest request, Authentication auth) {
        return service.addDepartment(request, auth.getName());
    }

    @GetMapping("/teams")
    public List<OrgOptionResponse> listTeams(
            @RequestParam Long institutionId,
            @RequestParam Long departmentId
    ) {
        return service.listTeams(institutionId, departmentId);
    }

    @PostMapping("/teams")
    public OrgOptionResponse addTeam(@Valid @RequestBody CreateTeamRequest request, Authentication auth) {
        return service.addTeam(request, auth.getName());
    }

    @GetMapping("/user/{id}")
    public OrgSelectionResponse getUserOrgSelection(@PathVariable("id") Long id, Authentication auth) {
        return service.getUserOrgSelection(id, auth.getName());
    }
}
