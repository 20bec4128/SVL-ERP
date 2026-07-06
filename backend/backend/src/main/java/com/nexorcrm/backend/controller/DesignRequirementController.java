package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.DesignRequirementRequest;
import com.nexorcrm.backend.dto.DesignRequirementResponse;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.service.DesignRequirementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/design-requirements")
public class DesignRequirementController {

    @Autowired
    private DesignRequirementService designRequirementService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create or update design requirement for a lead
     * POST /api/v1/design-requirements
     */
    @PostMapping
    public ResponseEntity<?> saveDesignRequirement(
            @RequestBody DesignRequirementRequest request,
            Authentication authentication) {
        try {
            if (request.getLeadId() == null || request.getLeadId() <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Lead ID is required"));
            }

            // Get current user ID from authentication email
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }
            String email = authentication.getName();
            User user = userRepository.findByEmailAndIsDeletedFalse(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Long userId = user.getId();

            DesignRequirementResponse response = designRequirementService.saveDesignRequirement(request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to save design requirement: " + e.getMessage()));
        }
    }

    /**
     * Get design requirement for a lead
     * GET /api/v1/design-requirements/lead/{leadId}
     */
    @GetMapping("/lead/{leadId}")
    public ResponseEntity<?> getDesignRequirement(@PathVariable Long leadId) {
        try {
            if (leadId == null || leadId <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Valid lead ID is required"));
            }

            DesignRequirementResponse response = designRequirementService.getDesignRequirement(leadId);
            if (response == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Design requirement not found for lead ID: " + leadId));
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to retrieve design requirement: " + e.getMessage()));
        }
    }

    /**
     * Check if design requirement exists for a lead
     * GET /api/v1/design-requirements/exists/{leadId}
     */
    @GetMapping("/exists/{leadId}")
    public ResponseEntity<?> checkDesignRequirementExists(@PathVariable Long leadId) {
        try {
            if (leadId == null || leadId <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Valid lead ID is required"));
            }

            boolean exists = designRequirementService.existsForLead(leadId);
            return ResponseEntity.ok(new ExistsResponse(exists));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to check design requirement: " + e.getMessage()));
        }
    }

    /**
     * Delete design requirement for a lead
     * DELETE /api/v1/design-requirements/lead/{leadId}
     */
    @DeleteMapping("/lead/{leadId}")
    public ResponseEntity<?> deleteDesignRequirement(@PathVariable Long leadId) {
        try {
            if (leadId == null || leadId <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Valid lead ID is required"));
            }

            designRequirementService.deleteDesignRequirement(leadId);
            return ResponseEntity.ok(new SuccessResponse("Design requirement deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to delete design requirement: " + e.getMessage()));
        }
    }

    // Helper response classes
    public static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class SuccessResponse {
        private String message;

        public SuccessResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class ExistsResponse {
        private boolean exists;

        public ExistsResponse(boolean exists) {
            this.exists = exists;
        }

        public boolean isExists() {
            return exists;
        }

        public void setExists(boolean exists) {
            this.exists = exists;
        }
    }
}
