package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.RequirementRequest;
import com.nexorcrm.backend.dto.RequirementResponse;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.service.RequirementService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/requirements")
public class RequirementController {

    @Autowired
    private RequirementService requirementService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a new requirement
     * POST /api/v1/requirements
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createRequirement(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            RequirementRequest request = mapper.readValue(dataJson, RequirementRequest.class);

            if (request.getLeadId() == null || request.getLeadId() <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Lead ID is required"));
            }

            RequirementResponse response = requirementService.createRequirement(request, files, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to create requirement: " + e.getMessage()));
        }
    }

    /**
     * Update an existing requirement
     * PUT /api/v1/requirements/{id}
     */
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> updateRequirement(
            @PathVariable Long id,
            @RequestPart("data") String dataJson,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {
        try {
            Long userId = resolveUserId(authentication);

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            RequirementRequest request = mapper.readValue(dataJson, RequirementRequest.class);

            RequirementResponse response = requirementService.updateRequirement(id, request, files, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to update requirement: " + e.getMessage()));
        }
    }

    /**
     * Get all requirements for a lead
     * GET /api/v1/requirements/lead/{leadId}
     */
    @GetMapping("/lead/{leadId}")
    public ResponseEntity<?> getRequirementsByLead(@PathVariable Long leadId) {
        try {
            if (leadId == null || leadId <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Valid lead ID is required"));
            }

            List<RequirementResponse> requirements = requirementService.getRequirementsByLeadId(leadId);
            return ResponseEntity.ok(requirements);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to retrieve requirements: " + e.getMessage()));
        }
    }

    /**
     * Get a single requirement by ID
     * GET /api/v1/requirements/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRequirement(@PathVariable Long id) {
        try {
            RequirementResponse response = requirementService.getRequirementById(id);
            if (response == null) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to retrieve requirement: " + e.getMessage()));
        }
    }

    /**
     * Delete a requirement
     * DELETE /api/v1/requirements/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequirement(@PathVariable Long id) {
        try {
            requirementService.deleteRequirement(id);
            return ResponseEntity.ok(new SuccessResponse("Requirement deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to delete requirement: " + e.getMessage()));
        }
    }

    /**
     * Delete a single file from a requirement
     * DELETE /api/v1/requirements/files/{fileId}
     */
    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<?> deleteRequirementFile(@PathVariable Long fileId) {
        try {
            requirementService.deleteRequirementFile(fileId);
            return ResponseEntity.ok(new SuccessResponse("File deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to delete file: " + e.getMessage()));
        }
    }

    // ===== Helpers =====

    private Long resolveUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    public static class ErrorResponse {
        private String error;
        public ErrorResponse(String error) { this.error = error; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }

    public static class SuccessResponse {
        private String message;
        public SuccessResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
