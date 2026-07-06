package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.DealResponse;
import com.nexorcrm.backend.dto.LeadUpdateDetailsRequest;
import com.nexorcrm.backend.dto.ProductionRequirementResponse;
import com.nexorcrm.backend.entity.LeadChatMessage;
import com.nexorcrm.backend.service.LeadChatService;
import com.nexorcrm.backend.service.DealService;
import com.nexorcrm.backend.service.LeadService;
import com.nexorcrm.backend.service.ProductionRequirementService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/deals")
public class DealController {

    private final DealService dealService;
    private final LeadChatService leadChatService;
    private final LeadService leadService;
    private final ProductionRequirementService productionRequirementService;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public DealController(DealService dealService,
                          LeadChatService leadChatService,
                          LeadService leadService,
                          ProductionRequirementService productionRequirementService) {
        this.dealService = dealService;
        this.leadChatService = leadChatService;
        this.leadService = leadService;
        this.productionRequirementService = productionRequirementService;
    }

    @GetMapping
    public List<DealResponse> list(Authentication authentication) {
        return dealService.list(authentication.getName());
    }

    @GetMapping("/{id}")
    public DealResponse getById(@PathVariable Long id, Authentication authentication) {
        try {
            return dealService.getById(id, authentication.getName());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/lead/{leadId}")
    public DealResponse getByLeadId(@PathVariable Long leadId) {
        try {
            return dealService.getDealByLeadId(leadId);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, Authentication authentication) {
        try {
            dealService.delete(id, authentication.getName());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (AccessDeniedException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @PatchMapping("/{id}")
    public DealResponse updateDetails(@PathVariable Long id, @RequestBody Map<String, Object> updates, Authentication authentication) {
        try {
            return dealService.updateDetails(id, updates, authentication.getName());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public DealResponse updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload, Authentication authentication) {
        try {
            String status = payload == null || payload.get("status") == null
                    ? null
                    : String.valueOf(payload.get("status")).trim();
            if (status == null || status.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
            }
            return dealService.updateStatus(id, status, authentication.getName());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping(value = "/{id}/payment-proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadPaymentProof(@PathVariable Long id,
                                                  @RequestParam("file") MultipartFile file,
                                                  Authentication authentication) {
        try {
            Long sourceLeadId = dealService.getSourceLeadIdForPaymentProofUpload(id, authentication.getName());
            return leadService.uploadPaymentProofFromDeal(sourceLeadId, file);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (AccessDeniedException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @PatchMapping("/{id}/payment-verification")
    public Map<String, Object> updatePaymentVerification(@PathVariable Long id,
                                                         @RequestBody LeadUpdateDetailsRequest request,
                                                         Authentication authentication) {
        try {
            return dealService.updatePaymentVerification(id, request, authentication.getName());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (AccessDeniedException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @GetMapping("/design-requests")
    public List<DealResponse> listDesignRequests(Authentication authentication) {
        return dealService.listDesignRequests(authentication.getName());
    }

    @GetMapping("/production-requests")
    public List<DealResponse> listProductionRequests(Authentication authentication) {
        return dealService.listProductionRequests(authentication.getName());
    }

    @PatchMapping("/{id}/production-work-status")
    public DealResponse updateProductionWorkStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload, Authentication authentication) {
        try {
            String workStatus = payload == null || payload.get("workStatus") == null
                    ? null
                    : String.valueOf(payload.get("workStatus")).trim();
            if (workStatus == null || workStatus.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Work status is required");
            }
            return dealService.updateProductionWorkStatus(id, workStatus, authentication.getName());
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/{id}/requirement-file")
    public org.springframework.http.ResponseEntity<Resource> downloadRequirementFile(@PathVariable Long id,
                                                                                    Authentication authentication) {
        DealResponse deal = dealService.getById(id, authentication.getName());
        return buildDealFileDownloadResponse(
                deal.getSourceLeadId(),
                deal.getRequirementFilePath(),
                deal.getRequirementFileName(),
                "Requirement file not found"
        );
    }

    @GetMapping("/{id}/artwork-file")
    public org.springframework.http.ResponseEntity<Resource> downloadArtworkFile(@PathVariable Long id,
                                                                                Authentication authentication) {
        DealResponse deal = dealService.getById(id, authentication.getName());
        try {
            return buildDealFileDownloadResponse(
                    deal.getSourceLeadId(),
                    deal.getArtworkFilePath(),
                    deal.getArtworkFileName(),
                    "Artwork file not found"
            );
        } catch (ResponseStatusException ex) {
            if (deal.getSourceLeadId() == null) {
                throw ex;
            }
            ProductionRequirementResponse productionRequirement =
                    productionRequirementService.getProductionRequirement(deal.getSourceLeadId());
            if (productionRequirement == null) {
                throw ex;
            }
            return buildFileResponse(
                    productionRequirement.getArtworkFilePath(),
                    productionRequirement.getArtworkFileName(),
                    "Artwork file not found"
            );
        }
    }

    // --- Design Workflow Endpoints ---
    @PostMapping("/{id}/design/start-work")
    public DealResponse startDesignWork(@PathVariable Long id, Authentication authentication) {
        return dealService.startDesignWork(id, authentication.getName());
    }

    @PostMapping("/{id}/design/upload-draft")
    public DealResponse uploadDesignDraft(@PathVariable Long id, @RequestParam("file") MultipartFile file, Authentication authentication) {
        return dealService.uploadDesignDraft(id, file, authentication.getName());
    }

    @PostMapping("/{id}/design/send-feedback")
    public DealResponse sendDesignFeedback(@PathVariable Long id, @RequestBody Map<String, Object> payload, Authentication authentication) {
        String message = payload == null ? null : String.valueOf(payload.get("message"));
        return dealService.sendDesignFeedback(id, message, authentication.getName());
    }

    @PostMapping("/{id}/design/approve-final")
    public DealResponse approveFinalDesign(@PathVariable Long id, Authentication authentication) {
        return dealService.approveFinalDesign(id, authentication.getName());
    }

    @PostMapping("/{id}/design/upload-final")
    public DealResponse uploadFinalDesign(@PathVariable Long id, @RequestParam("file") MultipartFile file, Authentication authentication) {
        return dealService.uploadFinalDesign(id, file, authentication.getName());
    }

    private org.springframework.http.ResponseEntity<Resource> buildDealFileDownloadResponse(Long leadId,
                                                                                            String storedPath,
                                                                                            String storedFileName,
                                                                                            String notFoundMessage) {
        Long messageId = extractChatMessageId(storedPath);
        if (messageId != null && leadId != null) {
            LeadChatMessage message = leadChatService.getAttachmentByLead(leadId, messageId);
            String path = message.getAttachmentPath();
            if (path == null || path.isBlank()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, notFoundMessage);
            }
            Resource resource = new FileSystemResource(path);
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, notFoundMessage);
            }

            String filename = StringUtils.hasText(message.getAttachmentName())
                    ? message.getAttachmentName().replace("\"", "")
                    : StringUtils.hasText(storedFileName)
                    ? storedFileName.replace("\"", "")
                    : Path.of(path).getFileName().toString().replace("\"", "");

            String contentType = message.getAttachmentType();
            MediaType mediaType;
            try {
                mediaType = contentType != null && !contentType.isBlank()
                        ? MediaType.parseMediaType(contentType)
                        : MediaType.APPLICATION_OCTET_STREAM;
            } catch (Exception ex) {
                mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }

            boolean inline = contentType != null && contentType.toLowerCase().startsWith("image/");
            String disposition = inline ? "inline" : "attachment";

            return org.springframework.http.ResponseEntity.ok()
                    .contentType(mediaType)
                    .header("Content-Disposition", disposition + "; filename=\"" + filename + "\"")
                    .body(resource);
        }

        return buildFileResponse(storedPath, storedFileName, notFoundMessage);
    }

    private org.springframework.http.ResponseEntity<Resource> buildFileResponse(String storedPath,
                                                                                String storedFileName,
                                                                                String notFoundMessage) {
        Path resolvedPath = resolveStoredFilePath(storedPath, storedFileName);
        Resource resource = new FileSystemResource(resolvedPath.toFile());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, notFoundMessage);
        }
        String downloadName = StringUtils.hasText(storedFileName)
                ? storedFileName.replace("\"", "")
                : resolvedPath.getFileName().toString().replace("\"", "");

        MediaType mediaType = MediaTypeFactory.getMediaType(downloadName)
                .or(() -> MediaTypeFactory.getMediaType(resolvedPath.getFileName().toString()))
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return org.springframework.http.ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", "attachment; filename=\"" + downloadName + "\"")
                .body(resource);
    }

    private Path resolveStoredFilePath(String storedPath, String storedFileName) {
        if (!StringUtils.hasText(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        String trimmed = storedPath.trim();
        Path directPath = Path.of(trimmed).toAbsolutePath().normalize();
        if (directPath.toFile().exists()) {
            return directPath;
        }

        String relativePath = trimmed.replaceFirst("^uploads[\\\\/]+", "");
        Path uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        Path uploadRelativePath = uploadRoot.resolve(relativePath).toAbsolutePath().normalize();
        if (uploadRelativePath.toFile().exists()) {
            return uploadRelativePath;
        }

        if (StringUtils.hasText(storedFileName)) {
            Path namedPath = uploadRoot.resolve(storedFileName).toAbsolutePath().normalize();
            if (namedPath.toFile().exists()) {
                return namedPath;
            }
        }

        return uploadRelativePath;
    }

    private Long extractChatMessageId(String storedPath) {
        if (!StringUtils.hasText(storedPath)) {
            return null;
        }

        String decoded = URLDecoder.decode(storedPath.trim(), StandardCharsets.UTF_8);
        String normalized = decoded.replace('\\', '/');
        String[] segments = normalized.split("/");
        for (int index = 0; index < segments.length - 1; index++) {
            if (!"messages".equalsIgnoreCase(segments[index])) {
                continue;
            }
            String candidate = segments[index + 1];
            try {
                return Long.valueOf(candidate);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
