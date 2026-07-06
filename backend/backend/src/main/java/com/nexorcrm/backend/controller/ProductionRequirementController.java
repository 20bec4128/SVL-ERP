package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ProductionRequirementRequest;
import com.nexorcrm.backend.dto.ProductionRequirementResponse;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.service.ProductionRequirementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/production-requirements")
public class ProductionRequirementController {

    @Autowired
    private ProductionRequirementService productionRequirementService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create or update production requirement for a lead
     * POST /api/v1/production-requirements
     */
    @PostMapping
    public ResponseEntity<?> saveProductionRequirement(
            @RequestBody ProductionRequirementRequest request,
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

            ProductionRequirementResponse response = productionRequirementService.saveProductionRequirement(request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to save production requirement: " + e.getMessage()));
        }
    }

    /**
     * Get production requirement for a lead
     * GET /api/v1/production-requirements/lead/{leadId}
     */
    @GetMapping("/lead/{leadId}")
    public ResponseEntity<?> getProductionRequirement(@PathVariable Long leadId) {
        try {
            if (leadId == null || leadId <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Valid lead ID is required"));
            }

            ProductionRequirementResponse response = productionRequirementService.getProductionRequirement(leadId);
            if (response == null) {
                return ResponseEntity.noContent().build();
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to retrieve production requirement: " + e.getMessage()));
        }
    }

    /**
     * Check if production requirement exists for a lead
     * GET /api/v1/production-requirements/exists/{leadId}
     */
    @GetMapping("/exists/{leadId}")
    public ResponseEntity<?> checkProductionRequirementExists(@PathVariable Long leadId) {
        try {
            if (leadId == null || leadId <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Valid lead ID is required"));
            }

            boolean exists = productionRequirementService.existsForLead(leadId);
            return ResponseEntity.ok(new ExistsResponse(exists));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to check production requirement: " + e.getMessage()));
        }
    }

    /**
     * Delete production requirement for a lead
     * DELETE /api/v1/production-requirements/lead/{leadId}
     */
    @DeleteMapping("/lead/{leadId}")
    public ResponseEntity<?> deleteProductionRequirement(@PathVariable Long leadId) {
        try {
            if (leadId == null || leadId <= 0) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Valid lead ID is required"));
            }

            productionRequirementService.deleteProductionRequirement(leadId);
            return ResponseEntity.ok(new SuccessResponse("Production requirement deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to delete production requirement: " + e.getMessage()));
        }
    }

    // ===== Helper Classes =====

    public static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
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
