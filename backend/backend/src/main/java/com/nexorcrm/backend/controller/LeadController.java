package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.BulkLeadCreateRequest;
import com.nexorcrm.backend.dto.BulkLeadResponse;
import com.nexorcrm.backend.dto.CheckDuplicatesContactResponse;
import com.nexorcrm.backend.dto.CheckDuplicatesRequest;
import com.nexorcrm.backend.dto.ConvertDuplicateRequest;
import com.nexorcrm.backend.dto.ConvertDuplicateResponse;
import com.nexorcrm.backend.dto.LeadCreateRequest;
import com.nexorcrm.backend.dto.LeadAllocatorOptionResponse;
import com.nexorcrm.backend.dto.LeadAssignableGroupResponse;
import com.nexorcrm.backend.dto.LeadFiltersResponse;
import com.nexorcrm.backend.dto.LeadLogResponse;
import com.nexorcrm.backend.dto.LeadResponse;
import com.nexorcrm.backend.dto.LeadUpdateAllocatorRequest;
import com.nexorcrm.backend.dto.LeadUpdateDetailsRequest;
import com.nexorcrm.backend.dto.LeadUpdateStatusRequest;
import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.entity.LeadChatMessage;
import com.nexorcrm.backend.service.LeadChatService;
import com.nexorcrm.backend.service.LeadService;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.repo.LeadRepository;
import com.nexorcrm.backend.entity.Role;
import jakarta.validation.Valid;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaTypeFactory;
import org.springframework.core.io.Resource;
import org.springframework.util.StringUtils;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/leads")
public class LeadController {

    private final LeadService leadService;
    private final LeadChatService leadChatService;
    private final UserRepository userRepository;
    private final LeadRepository leadRepository;

    public LeadController(LeadService leadService,
                          LeadChatService leadChatService,
                          UserRepository userRepository,
                          LeadRepository leadRepository) {
        this.leadService = leadService;
        this.leadChatService = leadChatService;
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
    }

    @GetMapping
    public List<LeadResponse> list(@RequestParam(required = false) String search,
                                   @RequestParam(required = false) String project,
                                   @RequestParam(required = false) String primary,
                                   @RequestParam(required = false) String status,
                                   @RequestParam(required = false) String svStatus,
                                   @RequestParam(required = false) String owner,
                                   @RequestParam(required = false) String quickDate,
                                   Authentication authentication) {
        return leadService.list(authentication.getName(), search, project, primary, status, svStatus, owner, quickDate);
    }

    @GetMapping("/{id}")
    public LeadResponse getById(@PathVariable("id") Long id, Authentication authentication) {
        return leadService.getById(id, authentication.getName());
    }

    @GetMapping("/customer/{userId}")
    public LeadResponse getCustomerLeadByUserId(@PathVariable("userId") Long userId) {
        return leadService.getCustomerLeadByUserId(userId);
    }

    @GetMapping("/{id}/log")
    public List<LeadLogResponse> getLeadLog(@PathVariable("id") Long id, Authentication authentication) {
        return leadService.listLeadLogs(id, authentication.getName());
    }

    @GetMapping("/filters")
    public LeadFiltersResponse filters(Authentication authentication) {
        return leadService.filters(authentication.getName());
    }

    @GetMapping("/assignable-groups")
    public List<LeadAssignableGroupResponse> listAssignableGroups(Authentication authentication) {
        return leadService.listAssignableGroups(authentication.getName());
    }

    @GetMapping("/importable-employees")
    public List<LeadAllocatorOptionResponse> listImportableEmployees(Authentication authentication) {
        return leadService.getImportableEmployees(authentication.getName());
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> bulkCreate(@Valid @RequestBody BulkLeadCreateRequest request,
                                        Authentication authentication) {
        try {
            BulkLeadResponse result = leadService.bulkCreate(request, authentication.getName());
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public LeadResponse create(@Valid @RequestBody LeadCreateRequest request, Authentication authentication) {
        return leadService.create(request, authentication.getName());
    }

    @PostMapping("/check-duplicates")
    public List<CheckDuplicatesContactResponse> checkDuplicates(
            @RequestBody CheckDuplicatesRequest request,
            Authentication authentication) {
        return leadService.checkDuplicates(request, authentication.getName());
    }

    @GetMapping("/duplicates")
    public List<LeadResponse> getDuplicateLeads(Authentication authentication) {
        return leadService.getDuplicateLeads(authentication.getName());
    }

    @PatchMapping("/{id}/convert-duplicate")
    public ResponseEntity<ConvertDuplicateResponse> convertDuplicate(
            @PathVariable("id") Long id,
            @RequestBody ConvertDuplicateRequest request,
            Authentication authentication) {
        try {
            ConvertDuplicateResponse result = leadService.convertDuplicate(id, request, authentication.getName());
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/status")
    public LeadResponse updateStatus(@PathVariable("id") Long id,
                                     @Valid @RequestBody LeadUpdateStatusRequest request,
                                     Authentication authentication) {
        try {
            return leadService.updateStatus(id, request, authentication.getName());
        } catch (IllegalStateException ise) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, ise.getMessage());
        } catch (RuntimeException ex) {
            Throwable root = NestedExceptionUtils.getMostSpecificCause(ex);
            String message = root != null && root.getMessage() != null ? root.getMessage() : ex.getMessage();
            if (message != null && (message.contains("Cannot move lead to")
                    || message.contains("This status transition is not allowed by flow")
                    || message.contains("Invalid lead status")
                    || message.contains("no eligible active employee available for lead assignment"))) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, message);
            }
            throw ex;
        }
    }

    @GetMapping("/{id}/assignable-allocators")
    public List<LeadAllocatorOptionResponse> listAssignableAllocators(@PathVariable("id") Long id,
                                                                      @RequestParam(value = "groupId", required = false) Long groupId,
                                                                      Authentication authentication) {
        return leadService.listAssignableAllocators(id, groupId, authentication.getName());
    }

    @PatchMapping("/{id}/allocator")
    public LeadResponse updateAllocator(@PathVariable("id") Long id,
                                        @Valid @RequestBody LeadUpdateAllocatorRequest request,
                                        Authentication authentication) {
        return leadService.updateAllocator(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/details")
    public LeadResponse updateDetails(@PathVariable("id") Long id,
                                      @RequestBody LeadUpdateDetailsRequest request,
                                      Authentication authentication) {
        return leadService.updateDetails(id, request, authentication.getName());
    }

    @PostMapping(value = "/{id}/payment-proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadPaymentProof(@PathVariable("id") Long id,
                                                  @RequestParam("file") MultipartFile file,
                                                  Authentication authentication) {
        return leadService.uploadPaymentProof(id, file, authentication.getName());
    }

    @PostMapping(value = "/{id}/log-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadLeadLogFile(@PathVariable("id") Long id,
                                                 @RequestParam("file") MultipartFile file,
                                                 Authentication authentication) {
        return leadService.uploadLeadLogFile(id, file, authentication.getName());
    }

    @GetMapping("/{id}/chat/messages")
    public List<com.nexorcrm.backend.dto.LeadChatMessageResponse> listChatMessages(@PathVariable("id") Long id,
                                                                                  @RequestParam("threadType") String threadType,
                                                                                  Authentication authentication) {
        return leadChatService.listMessages(id,
                com.nexorcrm.backend.entity.LeadChatThreadType.valueOf(threadType.trim().toUpperCase()),
                authentication.getName());
    }

    @GetMapping("/chat/notifications")
    public List<com.nexorcrm.backend.dto.ChatNotificationResponse> listChatNotifications(
            @RequestParam(value = "since", required = false) String since,
            Authentication authentication) {
        String principal = authentication.getName();
        var actor = principal.contains("@")
                ? userRepository.findByEmailAndIsDeletedFalse(principal.trim().toLowerCase())
                .orElse(null)
                : userRepository.findByUsernameAndIsDeletedFalse(principal.trim())
                .orElse(null);
        List<Long> leadIds;
        if (actor != null && actor.getRole() == Role.EMPLOYEE) {
            // include leads the employee currently owns plus any design-phase leads
            // where they were the payment owner
            List<Long> owned = leadRepository.findByDeletedFalseAndOwnerUserIdOrderByCreatedAtDesc(actor.getId())
                    .stream().map(com.nexorcrm.backend.entity.Lead::getId)
                    .filter(Objects::nonNull)
                    .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
            List<Long> paymentOwned = leadRepository.findByDeletedFalseAndPaymentOwnerIdOrderByCreatedAtDesc(actor.getId())
                    .stream().map(com.nexorcrm.backend.entity.Lead::getId)
                    .filter(Objects::nonNull)
                    .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
            // merge while preserving uniqueness
            owned.addAll(paymentOwned.stream().filter(id -> !owned.contains(id)).toList());
            leadIds = owned;
        } else {
            List<LeadResponse> leads = leadService.list(authentication.getName(),
                    null, null, null, null, null, null, null);
            leadIds = leads.stream()
                    .map(LeadResponse::getId)
                    .filter(Objects::nonNull)
                    .toList();
        }
        return leadChatService.listNotifications(leadIds, authentication.getName(), since);
    }

    @PostMapping("/{id}/chat/messages")
    public com.nexorcrm.backend.dto.LeadChatMessageResponse sendChatMessage(@PathVariable("id") Long id,
                                                                            @Valid @RequestBody com.nexorcrm.backend.dto.LeadChatMessageRequest request,
                                                                            Authentication authentication) {
        return leadChatService.sendMessage(id, request, authentication.getName());
    }

    @PostMapping(value = "/{id}/chat/messages/file", consumes = {"multipart/form-data"})
    public com.nexorcrm.backend.dto.LeadChatMessageResponse sendChatMessageWithFile(@PathVariable("id") Long id,
                                                                                   @RequestParam("threadType") String threadType,
                                                                                   @RequestParam(value = "message", required = false) String message,
                                                                                   @RequestParam(value = "file", required = false) MultipartFile file,
                                                                                   Authentication authentication) {
        return leadChatService.sendMessageWithFile(id, threadType, message, file, authentication.getName());
    }

    @PatchMapping("/{id}/delete")
    public ApiMessageResponse deleteLead(@PathVariable("id") Long id, Authentication authentication) {
        leadService.deleteLead(id, authentication.getName());
        return new ApiMessageResponse("Lead deleted");
    }

    @GetMapping("/{id}/chat/messages/{messageId}/file")
    public ResponseEntity<Resource> getChatAttachment(@PathVariable("id") Long id,
                                                      @PathVariable("messageId") Long messageId,
                                                      Authentication authentication) {
        var message = leadChatService.getChatAttachment(id, messageId, authentication.getName());
        return buildChatAttachmentResponse(message);
    }

    @GetMapping("/{id}/files/{messageId}")
    public ResponseEntity<Resource> getLeadFileAttachment(@PathVariable("id") Long id,
                                                          @PathVariable("messageId") Long messageId,
                                                          Authentication authentication) {
        leadService.getById(id, authentication.getName());
        var message = leadChatService.getAttachmentByLead(id, messageId);
        return buildChatAttachmentResponse(message);
    }

    @GetMapping("/{id}/requirement-file")
    public ResponseEntity<Resource> downloadRequirementFile(@PathVariable("id") Long id,
                                                            Authentication authentication) {
        LeadResponse lead = leadService.getById(id, authentication.getName());
        ResponseEntity<Resource> chatAttachmentResponse = tryBuildChatAttachmentResponse(
                id,
                lead.getRequirementFilePath(),
                authentication
        );
        if (chatAttachmentResponse != null) {
            return chatAttachmentResponse;
        }
        return buildLeadFileDownloadResponse(
                lead.getRequirementFilePath(),
                lead.getRequirementFileName(),
                "Requirement file not found"
        );
    }

    private ResponseEntity<Resource> buildChatAttachmentResponse(LeadChatMessage message) {
        String path = message.getAttachmentPath();
        if (path == null || path.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Attachment not found");
        }
        Resource resource = new org.springframework.core.io.FileSystemResource(path);
        if (!resource.exists() || !resource.isReadable()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Attachment not found");
        }

        String filename = message.getAttachmentName();
        if (filename == null || filename.isBlank()) {
            filename = "attachment";
        }
        filename = filename.replace("\"", "");

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

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", disposition + "; filename=\"" + filename + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/payment-proof-file")
    public ResponseEntity<Resource> downloadPaymentProofFile(@PathVariable("id") Long id,
                                                             Authentication authentication) {
        LeadResponse lead = leadService.getById(id, authentication.getName());
        return buildLeadFileDownloadResponse(
                lead.getPaymentProofFilePath(),
                lead.getPaymentProofFileName(),
                "Payment proof file not found"
        );
    }

    private ResponseEntity<Resource> buildLeadFileDownloadResponse(String storedPath,
                                                                   String storedFileName,
                                                                   String notFoundMessage) {
        Path resolvedPath = resolveStoredFilePath(storedPath, storedFileName);
        Resource resource = new org.springframework.core.io.FileSystemResource(resolvedPath.toFile());
        if (!resource.exists() || !resource.isReadable()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, notFoundMessage);
        }

        String downloadName = StringUtils.hasText(storedFileName)
                ? storedFileName.replace("\"", "")
                : resolvedPath.getFileName().toString().replace("\"", "");

        MediaType mediaType = MediaTypeFactory.getMediaType(downloadName)
                .or(() -> MediaTypeFactory.getMediaType(resolvedPath.getFileName().toString()))
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", "attachment; filename=\"" + downloadName + "\"")
                .body(resource);
    }

    private ResponseEntity<Resource> tryBuildChatAttachmentResponse(Long leadId,
                                                                    String storedPath,
                                                                    Authentication authentication) {
        Long messageId = extractChatMessageId(storedPath);
        if (messageId == null) {
            return null;
        }
        leadService.getById(leadId, authentication.getName());
        var message = leadChatService.getAttachmentByLead(leadId, messageId);
        return buildChatAttachmentResponse(message);
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

    private Path resolveStoredFilePath(String storedPath, String storedFileName) {
        if (!StringUtils.hasText(storedPath) && !StringUtils.hasText(storedFileName)) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        if (StringUtils.hasText(storedPath)) {
            String raw = storedPath.replace('\\', '/').trim();
            String normalized = raw;
            if (normalized.contains("/uploads/")) {
                normalized = normalized.substring(normalized.indexOf("/uploads/") + "/uploads/".length());
            }
            normalized = normalized.replaceFirst("^uploads/", "").replaceFirst("^/+", "");

            Optional<Path> direct = tryResolveExistingPath(raw);
            if (direct.isPresent()) {
                return direct.get();
            }

            Optional<Path> uploadsRelative = tryResolveExistingPath(Paths.get("uploads", normalized).toString());
            if (uploadsRelative.isPresent()) {
                return uploadsRelative.get();
            }

            int slash = normalized.lastIndexOf('/');
            if (slash >= 0 && slash < normalized.length() - 1) {
                Optional<Path> byFileNameOnly = tryResolveExistingPath(
                        Paths.get("uploads", normalized.substring(slash + 1)).toString()
                );
                if (byFileNameOnly.isPresent()) {
                    return byFileNameOnly.get();
                }
            }
        }

        if (StringUtils.hasText(storedFileName)) {
            Optional<Path> byName = tryResolveExistingPath(Paths.get("uploads", storedFileName).toString());
            if (byName.isPresent()) {
                return byName.get();
            }
        }

        throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
    }

    private Optional<Path> tryResolveExistingPath(String rawPath) {
        if (!StringUtils.hasText(rawPath)) {
            return Optional.empty();
        }
        try {
            Path path = Paths.get(rawPath).normalize();
            if (path.toFile().exists()) {
                return Optional.of(path);
            }
            return Optional.empty();
        } catch (InvalidPathException ignored) {
            return Optional.empty();
        }
    }

    @GetMapping("/{id}/invoice-items")
    public List<com.nexorcrm.backend.entity.LeadInvoiceItem> getInvoiceItems(
            @PathVariable("id") Long id, Authentication authentication) {
        return leadService.getInvoiceItems(id, authentication.getName());
    }

    @PostMapping("/{id}/invoice-items")
    public List<com.nexorcrm.backend.entity.LeadInvoiceItem> saveInvoiceItems(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        java.math.BigDecimal cgst = body.get("cgstPercent") != null
                ? new java.math.BigDecimal(String.valueOf(body.get("cgstPercent"))) : null;
        java.math.BigDecimal sgst = body.get("sgstPercent") != null
                ? new java.math.BigDecimal(String.valueOf(body.get("sgstPercent"))) : null;
        return leadService.saveInvoiceItems(id, items, cgst, sgst, authentication.getName());
    }
}
