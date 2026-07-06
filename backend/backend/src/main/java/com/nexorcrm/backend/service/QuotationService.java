package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.QuotationActionRequest;
import com.nexorcrm.backend.dto.QuotationItemRequest;
import com.nexorcrm.backend.dto.QuotationItemResponse;
import com.nexorcrm.backend.dto.QuotationRequest;
import com.nexorcrm.backend.dto.QuotationResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexorcrm.backend.entity.Quotation;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.QuotationItem;
import com.nexorcrm.backend.entity.GstMaster;
import com.nexorcrm.backend.entity.Lead;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.repo.QuotationRepository;
import com.nexorcrm.backend.repo.GstMasterRepository;
import com.nexorcrm.backend.repo.LeadRepository;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.EmailTemplateRepository;
import com.nexorcrm.backend.repo.SalesOrderRepository;
import com.nexorcrm.backend.entity.EmailTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.AccessDeniedException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final GstMasterRepository gstMasterRepository;
    private final ObjectMapper objectMapper;
    private final EmailNotificationService emailNotificationService;
    private final EmployeeRepository employeeRepository;
    private final EmailTemplateRepository emailTemplateRepository;

    private final SalesOrderRepository salesOrderRepository;

    public QuotationService(
            QuotationRepository quotationRepository,
            LeadRepository leadRepository,
            UserRepository userRepository,
            GstMasterRepository gstMasterRepository,
            ObjectMapper objectMapper,
            EmailNotificationService emailNotificationService,
            EmployeeRepository employeeRepository,
            EmailTemplateRepository emailTemplateRepository,
            SalesOrderRepository salesOrderRepository) {
        this.quotationRepository = quotationRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.gstMasterRepository = gstMasterRepository;
        this.objectMapper = objectMapper;
        this.emailNotificationService = emailNotificationService;
        this.employeeRepository = employeeRepository;
        this.emailTemplateRepository = emailTemplateRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    public QuotationResponse createQuotation(QuotationRequest request) {
        Quotation quotation = new Quotation();
        quotation.setLeadId(request.getLeadId());
        quotation.setClientName(request.getClientName());
        quotation.setClientMobile(request.getClientMobile());
        quotation.setClientEmail(request.getClientEmail());
        quotation.setClientCompany(request.getClientCompany());
        applyLeadSnapshot(quotation, request);
        quotation.setNotes(request.getNotes());
        quotation.setValidityDate(request.getValidityDate());
        String requestedStatus = normalizeStatus(request.getStatus());
        quotation.setStatus(requestedStatus != null ? requestedStatus : "DRAFT");
        quotation.setIncludeDesignFee(Boolean.TRUE.equals(request.getIncludeDesignFee()));
        quotation.setDesignFeeAmount(resolveDesignFeeAmount(request));
        quotation.setDesignFeeDiscountPercent(resolveDesignFeeDiscountPercent(request, null));
        quotation.setDesignFeeGstPercent(resolveDesignFeeGstPercent(request, null));
        if (request.getCreatedById() != null) quotation.setCreatedById(request.getCreatedById());
        if (request.getCreatedByName() != null) quotation.setCreatedByName(request.getCreatedByName());
        if (request.getCreatedByEmail() != null) quotation.setCreatedByEmail(request.getCreatedByEmail());
        if (request.getCreatedByRole() != null) quotation.setCreatedByRole(request.getCreatedByRole());
        if (request.getCreatedByTeam() != null) quotation.setCreatedByTeam(request.getCreatedByTeam());

        BigDecimal discountPercent = clampNonNegativePercent(request.getDiscountPercent());
        BigDecimal gstPercent = resolveGstPercent(request);
        quotation.setDiscountPercent(discountPercent);
        quotation.setGstPercent(gstPercent);
        quotation.setCgstPercent(scalePercent(request.getCgstPct()));
        quotation.setSgstPercent(scalePercent(request.getSgstPct()));
        quotation.setIgstPercent(scalePercent(request.getIgstPct()));
        quotation.setGstRowsJson(writeGstRowsJson(request.getGstRows()));

        Long seq = quotationRepository.nextQuotationSeq();
        quotation.setQuotationNumber("QT-" + Year.now().getValue() + "-" + seq);

        List<QuotationItem> items = new ArrayList<>();
        if (request.getItems() != null) {
            for (int i = 0; i < request.getItems().size(); i++) {
                QuotationItemRequest ir = request.getItems().get(i);
                QuotationItem item = new QuotationItem();
                item.setQuotation(quotation);
                item.setRequirementId(ir.getRequirementId());
                item.setGstMasterId(resolveItemGstMasterId(ir.getGstMasterId()));
                item.setProductName(ir.getProductName());
                item.setSpecsSummary(ir.getSpecsSummary());
                item.setSpecsJson(ir.getSpecsJson());
                item.setQuantity(ir.getQuantity() != null ? ir.getQuantity() : 1);
                item.setUnitPrice(ir.getUnitPrice() != null ? ir.getUnitPrice() : BigDecimal.ZERO);
                item.setDiscountPercent(resolveItemPercent(ir.getDiscountPct(), discountPercent));
                item.setGstPercent(resolveItemGstPercent(ir.getGstMasterId(), ir.getGstPct(), gstPercent));
                applyItemTotals(item);
                item.setSortOrder(i);
                items.add(item);
            }
        }
        quotation.setItems(items);
        recomputeTotals(quotation, request);

        applyApprovalMetadata(quotation, quotation.getStatus(), request);

        Quotation saved = quotationRepository.save(quotation);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<QuotationResponse> getQuotationsByLead(Long leadId) {
        return quotationRepository.findByLeadIdOrderByCreatedAtDesc(leadId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuotationResponse getQuotationById(Long id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found"));
        return toResponse(quotation);
    }

    private QuotationResponse toResponse(Quotation q) {
        QuotationResponse r = new QuotationResponse();
        r.setId(q.getId());
        r.setLeadId(q.getLeadId());
        r.setQuotationNumber(q.getQuotationNumber());
        Lead leadSnapshot = resolveLeadSnapshot(q.getLeadId());
        r.setClientName(leadSnapshot != null && leadSnapshot.getName() != null && !leadSnapshot.getName().isBlank() ? leadSnapshot.getName() : q.getClientName());
        r.setClientMobile(leadSnapshot != null && leadSnapshot.getMobile() != null && !leadSnapshot.getMobile().isBlank() ? leadSnapshot.getMobile() : q.getClientMobile());
        r.setClientEmail(leadSnapshot != null && leadSnapshot.getEmail() != null && !leadSnapshot.getEmail().isBlank() ? leadSnapshot.getEmail() : q.getClientEmail());
        r.setClientCompany(leadSnapshot != null && leadSnapshot.getCompanyName() != null && !leadSnapshot.getCompanyName().isBlank() ? leadSnapshot.getCompanyName() : q.getClientCompany());
        String clientAddress = firstNonBlank(q.getClientAddress(), leadSnapshot != null ? leadSnapshot.getStreetAddress() : null);
        String clientState = firstNonBlank(q.getClientState(), leadSnapshot != null ? leadSnapshot.getLeadState() : null);
        r.setClientAddress(clientAddress);
        r.setStreetAddress(clientAddress);
        r.setClientState(clientState);
        r.setLeadState(clientState);
        r.setClientGstin(leadSnapshot != null ? leadSnapshot.getGstin() : null);
        r.setSubtotal(q.getSubtotal());
        r.setDiscountPercent(q.getDiscountPercent());
        r.setGstPercent(q.getGstPercent());
        r.setGstPctTotal(q.getGstPercent());
        r.setCgstPct(q.getCgstPercent());
        r.setSgstPct(q.getSgstPercent());
        r.setIgstPct(q.getIgstPercent());
        r.setIncludeDesignFee(q.isIncludeDesignFee());
        r.setDesignFeeAmount(q.getDesignFeeAmount());
        r.setDesignFeeDiscountPct(q.getDesignFeeDiscountPercent());
        r.setDesignFeeGstPct(q.getDesignFeeGstPercent());
        r.setGrandTotal(q.getGrandTotal());
        r.setNotes(q.getNotes());
        r.setValidityDate(q.getValidityDate());
        r.setStatus(q.getStatus());
        if (leadSnapshot != null) {
            r.setLeadStatus(leadSnapshot.getStatus());
        }
        if (q.getLeadId() != null) {
            List<com.nexorcrm.backend.entity.SalesOrder> orders = salesOrderRepository.findByLeadId(q.getLeadId());
            if (orders != null && !orders.isEmpty()) {
                r.setSalesOrderStatus(orders.get(orders.size() - 1).getStatus());
            }
        }
        r.setCreatedAt(q.getCreatedAt());
        r.setUpdatedAt(q.getUpdatedAt());
        r.setCreatedById(q.getCreatedById());
        r.setCreatedByName(q.getCreatedByName());
        r.setCreatedByEmail(q.getCreatedByEmail());
        r.setCreatedByRole(q.getCreatedByRole());
        r.setCreatedByTeam(q.getCreatedByTeam());
        r.setVerificationRequestedAt(q.getVerificationRequestedAt());
        r.setVerificationRequestedById(q.getVerificationRequestedById());
        r.setVerificationRequestedByName(q.getVerificationRequestedByName());
        r.setVerificationRequestedByRole(q.getVerificationRequestedByRole());
        r.setVerificationRequestNotes(q.getVerificationRequestNotes());
        r.setApprovedAt(q.getApprovedAt());
        r.setApprovedById(q.getApprovedById());
        r.setApprovedByName(q.getApprovedByName());
        r.setApprovedByRole(q.getApprovedByRole());
        r.setApprovalNotes(q.getApprovalNotes());
        r.setGstRows(readGstRows(q.getGstRowsJson()));
        r.setItems(q.getItems().stream().map(this::toItemResponse).collect(Collectors.toList()));
        return r;
    }

    private QuotationItemResponse toItemResponse(QuotationItem item) {
        QuotationItemResponse r = new QuotationItemResponse();
        r.setId(item.getId());
        r.setRequirementId(item.getRequirementId());
        r.setGstMasterId(item.getGstMasterId());
        r.setProductName(item.getProductName());
        r.setSpecsSummary(item.getSpecsSummary());
        r.setSpecsJson(item.getSpecsJson());
        r.setQuantity(item.getQuantity());
        r.setUnitPrice(item.getUnitPrice());
        r.setDiscountPct(item.getDiscountPercent());
        r.setGstPct(item.getGstPercent());
        BigDecimal quantity = BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 0);
        BigDecimal unitPrice = scaleMoney(item.getUnitPrice());
        BigDecimal baseAmount = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountAmount = baseAmount.multiply(
                clampNonNegativePercent(item.getDiscountPercent()).divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
        ).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxableAmount = baseAmount.subtract(discountAmount);
        BigDecimal gstAmount = taxableAmount.multiply(
                clampNonNegativePercent(item.getGstPercent()).divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
        ).setScale(2, RoundingMode.HALF_UP);
        r.setBaseAmount(baseAmount);
        r.setDiscountAmount(discountAmount);
        r.setGstAmount(gstAmount);
        r.setLineTotal(item.getLineTotal());
        r.setSortOrder(item.getSortOrder());
        return r;
    }

    @Transactional(readOnly = true)
    public List<QuotationResponse> getAllQuotations(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        List<Quotation> quotations = quotationRepository.findAllByOrderByCreatedAtDesc();
        if (actor != null) {
            if (actor.getRole() == Role.EMPLOYEE) {
                quotations = loadQuotationsForEmployee(actor);
            } else if (actor.getRole() == Role.TEAM_LEAD || actor.getRole() == Role.MANAGER) {
                quotations = quotations.stream()
                        .filter(quotation -> isVisibleToActor(actor, quotation))
                        .collect(Collectors.toList());
            }
        }
        return quotations
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QuotationResponse> getAllQuotations() {
        return quotationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public QuotationResponse updateQuotation(Long id, QuotationRequest request) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + id));

        q.setClientName(request.getClientName());
        q.setClientMobile(request.getClientMobile());
        q.setClientEmail(request.getClientEmail());
        q.setClientCompany(request.getClientCompany());
        applyLeadSnapshot(q, request);
        q.setNotes(request.getNotes());
        q.setValidityDate(request.getValidityDate());
        q.setIncludeDesignFee(Boolean.TRUE.equals(request.getIncludeDesignFee()));
        q.setDesignFeeAmount(resolveDesignFeeAmount(request));
        q.setDesignFeeDiscountPercent(resolveDesignFeeDiscountPercent(request, q));
        q.setDesignFeeGstPercent(resolveDesignFeeGstPercent(request, q));

        String requestedStatus = normalizeStatus(request.getStatus());
        if (requestedStatus != null) {
            q.setStatus(requestedStatus);
            applyApprovalMetadata(q, requestedStatus, request);
        }

        if (request.getDiscountPercent() != null) q.setDiscountPercent(clampNonNegativePercent(request.getDiscountPercent()));
        q.setGstPercent(resolveGstPercent(request));
        q.setCgstPercent(scalePercent(request.getCgstPct()));
        q.setSgstPercent(scalePercent(request.getSgstPct()));
        q.setIgstPercent(scalePercent(request.getIgstPct()));
        q.setGstRowsJson(writeGstRowsJson(request.getGstRows()));

        if (request.getItems() != null) {
            q.getItems().clear();
            for (int i = 0; i < request.getItems().size(); i++) {
                QuotationItemRequest ir = request.getItems().get(i);
                QuotationItem item = new QuotationItem();
                item.setQuotation(q);
                item.setRequirementId(ir.getRequirementId());
                item.setGstMasterId(resolveItemGstMasterId(ir.getGstMasterId()));
                item.setProductName(ir.getProductName());
                item.setSpecsSummary(ir.getSpecsSummary());
                item.setSpecsJson(ir.getSpecsJson());
                item.setQuantity(ir.getQuantity() != null ? ir.getQuantity() : 1);
                item.setUnitPrice(ir.getUnitPrice() != null ? ir.getUnitPrice() : BigDecimal.ZERO);
                item.setDiscountPercent(resolveItemPercent(ir.getDiscountPct(), q.getDiscountPercent()));
                item.setGstPercent(resolveItemGstPercent(ir.getGstMasterId(), ir.getGstPct(), q.getGstPercent()));
                applyItemTotals(item);
                item.setSortOrder(i);
                q.getItems().add(item);
            }
        }

        recomputeTotals(q, request);

        return toResponse(quotationRepository.save(q));
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        return status.trim().toUpperCase(Locale.ROOT);
    }

    private void applyApprovalMetadata(Quotation quotation, String status, QuotationRequest request) {
        if (!"APPROVED".equals(status)) {
            quotation.setApprovedAt(null);
            quotation.setApprovedById(null);
            quotation.setApprovedByName(null);
            quotation.setApprovedByRole(null);
            quotation.setApprovalNotes(null);
            return;
        }

        quotation.setApprovedAt(LocalDateTime.now());
        quotation.setApprovedById(request.getCreatedById());
        quotation.setApprovedByName(request.getCreatedByName());
        quotation.setApprovedByRole(request.getCreatedByRole());
        quotation.setApprovalNotes(request.getNotes());
    }

    private BigDecimal resolveGstPercent(QuotationRequest request) {
        if (request.getGstPctTotal() != null) {
            return scalePercent(request.getGstPctTotal());
        }
        if (request.getGstPercent() != null) {
            return scalePercent(request.getGstPercent());
        }
        return scalePercent(request.getCgstPct())
                .add(scalePercent(request.getSgstPct()))
                .add(scalePercent(request.getIgstPct()));
    }

    private BigDecimal scalePercent(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private void recomputeTotals(Quotation quotation, QuotationRequest request) {
        BigDecimal itemsSubtotal = BigDecimal.ZERO;
        BigDecimal itemsDiscount = BigDecimal.ZERO;
        BigDecimal itemsTax = BigDecimal.ZERO;

        if (quotation.getItems() != null) {
            for (QuotationItem item : quotation.getItems()) {
                BigDecimal quantity = BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 0);
                BigDecimal unitPrice = scaleMoney(item.getUnitPrice());
                BigDecimal baseAmount = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
                BigDecimal discountPercent = clampNonNegativePercent(item.getDiscountPercent());
                BigDecimal discountAmount = baseAmount.multiply(
                        discountPercent.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
                ).setScale(2, RoundingMode.HALF_UP);
                BigDecimal taxableAmount = baseAmount.subtract(discountAmount);
                BigDecimal gstAmount = taxableAmount.multiply(
                        clampNonNegativePercent(item.getGstPercent()).divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
                ).setScale(2, RoundingMode.HALF_UP);
                itemsSubtotal = itemsSubtotal.add(baseAmount);
                itemsDiscount = itemsDiscount.add(discountAmount);
                itemsTax = itemsTax.add(gstAmount);
            }
        }

        BigDecimal designFee = quotation.isIncludeDesignFee()
                ? scaleMoney(quotation.getDesignFeeAmount())
                : BigDecimal.ZERO;
        BigDecimal designFeeDiscountPercent = quotation.isIncludeDesignFee()
                ? clampNonNegativePercent(quotation.getDesignFeeDiscountPercent())
                : BigDecimal.ZERO;
        BigDecimal designFeeDiscount = designFee.multiply(
                designFeeDiscountPercent.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
        ).setScale(2, RoundingMode.HALF_UP);
        BigDecimal designFeeTaxable = designFee.subtract(designFeeDiscount);
        BigDecimal designFeeTaxPercent = quotation.isIncludeDesignFee()
                ? clampNonNegativePercent(quotation.getDesignFeeGstPercent())
                : BigDecimal.ZERO;
        BigDecimal designFeeTax = designFeeTaxable.multiply(
                designFeeTaxPercent.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
        ).setScale(2, RoundingMode.HALF_UP);

        BigDecimal subtotal = itemsSubtotal.add(designFee);
        BigDecimal afterDiscount = subtotal.subtract(itemsDiscount.add(designFeeDiscount));
        BigDecimal grandTotal = afterDiscount.add(itemsTax).add(designFeeTax).setScale(2, RoundingMode.HALF_UP);

        quotation.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        quotation.setGrandTotal(grandTotal);
    }

    private BigDecimal resolveItemPercent(BigDecimal value, BigDecimal fallback) {
        if (value != null) {
            return clampNonNegativePercent(value);
        }
        return clampNonNegativePercent(fallback);
    }

    private Long resolveItemGstMasterId(Long gstMasterId) {
        if (gstMasterId == null) {
            return null;
        }
        return gstMasterRepository.findById(gstMasterId)
                .map(GstMaster::getId)
                .orElse(null);
    }

    private BigDecimal resolveItemGstPercent(Long gstMasterId, BigDecimal fallbackValue, BigDecimal fallbackPercent) {
        if (gstMasterId != null) {
            Optional<GstMaster> master = gstMasterRepository.findById(gstMasterId);
            if (master.isPresent()) {
                return clampNonNegativePercent(master.get().getTaxPercent());
            }
        }
        return resolveItemPercent(fallbackValue, fallbackPercent);
    }

    private void applyItemTotals(QuotationItem item) {
        BigDecimal quantity = BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 0);
        BigDecimal unitPrice = scaleMoney(item.getUnitPrice());
        BigDecimal baseAmount = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountPercent = clampNonNegativePercent(item.getDiscountPercent());
        BigDecimal discountAmount = baseAmount.multiply(
                discountPercent.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
        ).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxableAmount = baseAmount.subtract(discountAmount);
        BigDecimal gstAmount = taxableAmount.multiply(
                clampNonNegativePercent(item.getGstPercent()).divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
        ).setScale(2, RoundingMode.HALF_UP);

        item.setUnitPrice(unitPrice);
        item.setDiscountPercent(discountPercent);
        item.setGstPercent(clampNonNegativePercent(item.getGstPercent()));
        item.setLineTotal(taxableAmount.add(gstAmount).setScale(2, RoundingMode.HALF_UP));
    }

    private BigDecimal resolveDesignFeeAmount(QuotationRequest request) {
        if (!Boolean.TRUE.equals(request.getIncludeDesignFee())) {
            return BigDecimal.ZERO;
        }
        return scaleMoney(request.getDesignFeeAmount());
    }

    private BigDecimal resolveDesignFeeDiscountPercent(QuotationRequest request, Quotation existing) {
        if (!Boolean.TRUE.equals(request.getIncludeDesignFee())) {
            return BigDecimal.ZERO;
        }
        if (request.getDesignFeeDiscountPct() != null) {
            return clampNonNegativePercent(request.getDesignFeeDiscountPct());
        }
        if (existing != null && existing.getDesignFeeDiscountPercent() != null) {
            return clampNonNegativePercent(existing.getDesignFeeDiscountPercent());
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal resolveDesignFeeGstPercent(QuotationRequest request, Quotation existing) {
        if (!Boolean.TRUE.equals(request.getIncludeDesignFee())) {
            return BigDecimal.ZERO;
        }
        if (request.getDesignFeeGstPct() != null) {
            return clampNonNegativePercent(request.getDesignFeeGstPct());
        }
        if (existing != null && existing.getDesignFeeGstPercent() != null) {
            BigDecimal stored = clampNonNegativePercent(existing.getDesignFeeGstPercent());
            if (stored.compareTo(BigDecimal.ZERO) > 0) {
                return stored;
            }
        }
        return resolveGstPercent(request);
    }

    private void applyLeadSnapshot(Quotation quotation, QuotationRequest request) {
        if (quotation == null) {
            return;
        }

        Lead leadSnapshot = resolveLeadSnapshot(request != null ? request.getLeadId() : quotation.getLeadId());
        String requestAddress = request == null ? null : firstNonBlank(request.getClientAddress(), request.getStreetAddress());
        String requestState = request == null ? null : firstNonBlank(request.getClientState(), request.getLeadState());
        String resolvedAddress = firstNonBlank(requestAddress, quotation.getClientAddress(), leadSnapshot != null ? leadSnapshot.getStreetAddress() : null);
        String resolvedState = firstNonBlank(requestState, quotation.getClientState(), leadSnapshot != null ? leadSnapshot.getLeadState() : null);

        quotation.setClientAddress(resolvedAddress);
        quotation.setClientState(resolvedState);
    }

    private Lead resolveLeadSnapshot(Long leadId) {
        if (leadId == null) {
            return null;
        }
        return leadRepository.findById(leadId).orElse(null);
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private BigDecimal clampNonNegativePercent(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal scaled = value.setScale(2, RoundingMode.HALF_UP);
        return scaled.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : scaled;
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private List<Quotation> loadQuotationsForEmployee(User actor) {
        // Collect all lead IDs assigned to this employee (via ownerUserId)
        List<Long> myLeadIds = new ArrayList<>();
        if (actor.getId() != null) {
            leadRepository.findByDeletedFalseAndOwnerUserIdOrderByCreatedAtDesc(actor.getId())
                    .forEach(lead -> myLeadIds.add(lead.getId()));
        }

        // Quotations the employee created themselves
        List<Quotation> ownQuotations = quotationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(quotation -> isOwnedByActor(actor, quotation))
                .collect(Collectors.toList());

        // Quotations on this employee's leads (created by team lead / manager / admin / super admin)
        List<Quotation> leadQuotations = myLeadIds.isEmpty()
                ? new ArrayList<>()
                : quotationRepository.findByLeadIdInOrderByCreatedAtDesc(myLeadIds);

        // Merge and deduplicate by quotation ID
        java.util.Map<Long, Quotation> merged = new java.util.LinkedHashMap<>();
        for (Quotation q : ownQuotations) {
            if (q.getId() != null) merged.put(q.getId(), q);
        }
        for (Quotation q : leadQuotations) {
            if (q.getId() != null) merged.putIfAbsent(q.getId(), q);
        }

        List<Quotation> quotations = new ArrayList<>(merged.values());
        quotations.sort((left, right) -> {
            LocalDateTime leftCreated = left.getCreatedAt();
            LocalDateTime rightCreated = right.getCreatedAt();
            if (leftCreated == null && rightCreated == null) return 0;
            if (leftCreated == null) return 1;
            if (rightCreated == null) return -1;
            return rightCreated.compareTo(leftCreated);
        });
        return quotations;
    }

    private boolean isVisibleToActor(User actor, Quotation quotation) {
        if (actor == null || quotation == null || actor.getRole() == null) {
            return false;
        }
        if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        User leadOwner = resolveLeadOwner(quotation);
        if (leadOwner != null) {
            if (actor.getRole() == Role.EMPLOYEE) {
                return Objects.equals(actor.getId(), leadOwner.getId()) || isOwnedByActor(actor, quotation);
            }
            if (actor.getRole() == Role.TEAM_LEAD) {
                return matchesScope(leadOwner.getInstitutionName(), actor.getInstitutionName())
                        && matchesScope(leadOwner.getDepartmentName(), actor.getDepartmentName())
                        && matchesScope(leadOwner.getTeamName(), actor.getTeamName());
            }
            if (actor.getRole() == Role.MANAGER) {
                return matchesScope(leadOwner.getInstitutionName(), actor.getInstitutionName())
                        && matchesScope(leadOwner.getDepartmentName(), actor.getDepartmentName());
            }
        }

        User creator = resolveQuotationCreator(quotation);
        if (creator != null) {
            if (actor.getRole() == Role.EMPLOYEE) {
                return isOwnedByActor(actor, quotation);
            }
            if (actor.getRole() == Role.TEAM_LEAD) {
                return matchesScope(creator.getInstitutionName(), actor.getInstitutionName())
                        && matchesScope(creator.getDepartmentName(), actor.getDepartmentName())
                        && matchesScope(creator.getTeamName(), actor.getTeamName());
            }
            if (actor.getRole() == Role.MANAGER) {
                return matchesScope(creator.getInstitutionName(), actor.getInstitutionName())
                        && matchesScope(creator.getDepartmentName(), actor.getDepartmentName());
            }
        }

        return isOwnedByActor(actor, quotation);
    }

    private boolean isOwnedByActor(User actor, Quotation quotation) {
        if (actor.getId() != null && quotation.getCreatedById() != null) {
            return actor.getId().equals(quotation.getCreatedById());
        }
        if (StringUtils.hasText(actor.getEmail()) && StringUtils.hasText(quotation.getCreatedByEmail())) {
            return actor.getEmail().trim().equalsIgnoreCase(quotation.getCreatedByEmail().trim());
        }
        String actorFullName = String.join(" ",
                StringUtils.hasText(actor.getFirstName()) ? actor.getFirstName().trim() : "",
                StringUtils.hasText(actor.getLastName()) ? actor.getLastName().trim() : "").trim();
        if (StringUtils.hasText(actorFullName) && StringUtils.hasText(quotation.getCreatedByName())) {
            return actorFullName.equalsIgnoreCase(quotation.getCreatedByName().trim());
        }
        if (StringUtils.hasText(actor.getUsername()) && StringUtils.hasText(quotation.getCreatedByName())) {
            return actor.getUsername().trim().equalsIgnoreCase(quotation.getCreatedByName().trim());
        }
        return false;
    }

    private User resolveQuotationCreator(Quotation quotation) {
        if (quotation == null) {
            return null;
        }
        if (quotation.getCreatedById() != null) {
            return userRepository.findByIdAndIsDeletedFalse(quotation.getCreatedById()).orElse(null);
        }
        if (StringUtils.hasText(quotation.getCreatedByEmail())) {
            return userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(quotation.getCreatedByEmail().trim()).orElse(null);
        }
        return null;
    }

    private User resolveLeadOwner(Quotation quotation) {
        if (quotation == null || quotation.getLeadId() == null) {
            return null;
        }
        Lead lead = leadRepository.findByIdAndDeletedFalse(quotation.getLeadId()).orElse(null);
        if (lead == null || lead.getOwnerUserId() == null) {
            return null;
        }
        return userRepository.findByIdAndIsDeletedFalse(lead.getOwnerUserId()).orElse(null);
    }

    private boolean matchesScope(String left, String right) {
        return StringUtils.hasText(left)
                && StringUtils.hasText(right)
                && left.trim().equalsIgnoreCase(right.trim());
    }

    private User resolveActor(String actorPrincipal) {
        if (!StringUtils.hasText(actorPrincipal)) {
            throw new AccessDeniedException("Unauthenticated actor");
        }
        String principal = actorPrincipal.trim();
        Optional<User> user = principal.contains("@")
                ? userRepository.findByEmailAndIsDeletedFalse(principal.toLowerCase(Locale.ROOT))
                : userRepository.findByUsernameAndIsDeletedFalse(principal);
        if (user.isEmpty() && principal.contains("@")) {
            user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal);
        }
        return user.orElseThrow(() -> new AccessDeniedException("Actor not found"));
    }

    private String writeGstRowsJson(List<QuotationRequest.GstRowRequest> gstRows) {
        try {
            return objectMapper.writeValueAsString(gstRows == null ? List.of() : gstRows);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Unable to serialize GST rows", ex);
        }
    }

    private List<QuotationResponse.GstRowResponse> readGstRows(String gstRowsJson) {
        try {
            List<QuotationRequest.GstRowRequest> rows = objectMapper.readValue(
                    gstRowsJson == null || gstRowsJson.isBlank() ? "[]" : gstRowsJson,
                    new TypeReference<List<QuotationRequest.GstRowRequest>>() {}
            );
            return rows.stream().map(row -> {
                QuotationResponse.GstRowResponse response = new QuotationResponse.GstRowResponse();
                response.setGstMasterId(row.getGstMasterId());
                response.setTaxName(row.getTaxName());
                response.setTaxPercent(row.getTaxPercent());
                return response;
            }).toList();
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    public void deleteQuotation(Long id) {
        if (!quotationRepository.existsById(id)) {
            throw new EntityNotFoundException("Quotation not found: " + id);
        }
        quotationRepository.deleteById(id);
    }

    public QuotationResponse sendForVerification(Long id, QuotationActionRequest req) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + id));
        q.setStatus("VERIFICATION_PENDING");
        q.setVerificationRequestedAt(LocalDateTime.now());
        if (req != null) {
            q.setVerificationRequestedById(req.getActorId());
            q.setVerificationRequestedByName(req.getActorName());
            q.setVerificationRequestedByRole(req.getActorRole());
            q.setVerificationRequestNotes(req.getNotes());
        }
        return toResponse(quotationRepository.save(q));
    }

    public QuotationResponse approveQuotation(Long id, QuotationActionRequest req) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + id));
        q.setStatus("APPROVED");
        q.setApprovedAt(LocalDateTime.now());
        if (req != null) {
            q.setApprovedById(req.getActorId());
            q.setApprovedByName(req.getActorName());
            q.setApprovedByRole(req.getActorRole());
            q.setApprovalNotes(req.getNotes());
        }
        return toResponse(quotationRepository.save(q));
    }

    public QuotationResponse adminRejectQuotation(Long id, QuotationActionRequest req) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + id));
        q.setStatus("DRAFT");
        if (req != null) {
            q.setApprovalNotes(req.getNotes());
        }
        return toResponse(quotationRepository.save(q));
    }

    public QuotationResponse markSent(Long id, boolean sendEmail, MultipartFile file) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + id));
        q.setStatus("QUOTATION_SENT");

        if (sendEmail && q.getLeadId() != null) {
            leadRepository.findById(q.getLeadId()).ifPresent(lead -> {
                if (lead.getEmail() != null && !lead.getEmail().isBlank()) {
                    String subject = "Quotation " + (q.getQuotationNumber() != null ? q.getQuotationNumber() : "") + " - SVL Packaging & Printing";
                    StringBuilder sb = new StringBuilder();
                    sb.append("Dear ").append(q.getClientName() != null ? q.getClientName() : "Customer").append(",\n\n");
                    sb.append("We are pleased to send you our quotation.\n\n");
                    sb.append("Quotation Details:\n");
                    sb.append("Quotation Number: ").append(q.getQuotationNumber() != null ? q.getQuotationNumber() : "Draft").append("\n");
                    if (q.getItems() != null && !q.getItems().isEmpty()) {
                        sb.append("\nProducts:\n");
                        for (QuotationItem item : q.getItems()) {
                            sb.append("- ").append(item.getProductName())
                              .append(" (Qty: ").append(item.getQuantity()).append(")")
                              .append("\n");
                        }
                    }
                    if (q.getGrandTotal() != null) {
                        sb.append("\nGrand Total: Rs. ").append(q.getGrandTotal()).append("\n");
                    }
                    
                    sb.append("\nPlease find the complete details in the attached quotation document.\n\n");
                    sb.append("For any queries, negotiations, or to accept/reject this quotation, please contact our representative:\n");
                    
                    // Resolve contact person: prioritize Lead Owner details
                    final String[] contactName = { q.getCreatedByName() != null ? q.getCreatedByName() : "SVL Representative" };
                    final String[] contactEmail = { q.getCreatedByEmail() != null ? q.getCreatedByEmail() : "" };
                    final String[] contactMobile = { "" };
                    Long contactUserId = lead.getOwnerUserId() != null ? lead.getOwnerUserId() : q.getCreatedById();
                    
                    if (contactUserId != null) {
                        userRepository.findById(contactUserId).ifPresent(user -> {
                            String fullName = (user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getLastName() != null ? user.getLastName() : "");
                            fullName = fullName.trim();
                            if (!fullName.isEmpty()) {
                                contactName[0] = fullName;
                            }
                            if (user.getEmail() != null && !user.getEmail().isBlank()) {
                                contactEmail[0] = user.getEmail().trim();
                            }
                            if (user.getEmployeeId() != null) {
                                employeeRepository.findById(user.getEmployeeId()).ifPresent(emp -> {
                                    if (emp.getPhone() != null && !emp.getPhone().isBlank()) {
                                        String country = emp.getCountryCode() != null ? emp.getCountryCode().trim() : "";
                                        contactMobile[0] = (country + " " + emp.getPhone().trim()).trim();
                                    }
                                });
                            }
                        });
                    }
                    
                    EmailTemplate template = emailTemplateRepository.findByTemplateKey("QUOTATION_SENT_TEMPLATE").orElse(null);
                    String mailSubject = "Quotation " + (q.getQuotationNumber() != null ? q.getQuotationNumber() : "") + " - SVL Packaging & Printing";
                    String mailBody = "";
                    
                    if (template != null && template.isActive()) {
                        mailSubject = template.getSubject() != null
                                ? template.getSubject().replace("{{quotation_number}}", q.getQuotationNumber() != null ? q.getQuotationNumber() : "")
                                : mailSubject;
                        mailBody = template.getBody() != null
                                ? template.getBody()
                                    .replace("{{customer_name}}", q.getClientName() != null ? q.getClientName() : "Customer")
                                    .replace("{{representative_name}}", contactName[0])
                                    .replace("{{representative_email}}", contactEmail[0])
                                    .replace("{{representative_mobile}}", contactMobile[0])
                                : "";
                    } else {
                        StringBuilder fallback = new StringBuilder();
                        fallback.append("Dear ").append(q.getClientName() != null ? q.getClientName() : "Customer").append(",\n\n");
                        fallback.append("We are pleased to send you our quotation.\n\n");
                        fallback.append("Please find the complete details in the attached quotation document.\n\n");
                        fallback.append("For any queries, negotiations, or to accept/reject this quotation, please contact our representative:\n");
                        fallback.append("Name: ").append(contactName[0]).append("\n");
                        fallback.append("Email: ").append(contactEmail[0]).append("\n");
                        if (!contactMobile[0].isEmpty()) {
                            fallback.append("Mobile: ").append(contactMobile[0]).append("\n");
                        }
                        fallback.append("\nThank you for choosing SVL.\n\nBest Regards,\nSVL Packaging & Printing Team");
                        mailBody = fallback.toString();
                    }
                    
                    if (file != null && !file.isEmpty()) {
                        try {
                            emailNotificationService.notifyNowWithAttachmentIfEnabled(
                                    lead.getEmail().trim(),
                                    mailSubject,
                                    mailBody,
                                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "Quotation.pdf",
                                    file.getBytes()
                            );
                        } catch (Exception e) {
                            // Fallback to simple mail if attachment reading fails
                            emailNotificationService.notifyNowIfEnabled(lead.getEmail().trim(), mailSubject, mailBody);
                        }
                    } else {
                        emailNotificationService.notifyNowIfEnabled(lead.getEmail().trim(), mailSubject, mailBody);
                    }
                }
            });
        }

        return toResponse(quotationRepository.save(q));
    }

    public QuotationResponse markNegotiating(Long id, QuotationActionRequest req) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + id));
        q.setStatus("NEGOTIATING");
        if (req != null && req.getNotes() != null) q.setApprovalNotes(req.getNotes());
        return toResponse(quotationRepository.save(q));
    }

    public QuotationResponse markRejected(Long id, QuotationActionRequest req) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + id));
        q.setStatus("QUOTATION_REJECTED");
        if (req != null && req.getNotes() != null) q.setApprovalNotes(req.getNotes());
        return toResponse(quotationRepository.save(q));
    }

    public QuotationResponse markAccepted(Long id, QuotationActionRequest req) {
        Quotation q = quotationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Quotation not found: " + id));
        q.setStatus("QUOTATION_ACCEPTED");
        if (req != null && req.getNotes() != null) q.setApprovalNotes(req.getNotes());

        if (q.getLeadId() != null) {
            leadRepository.findById(q.getLeadId()).ifPresent(lead -> {
                lead.setStatus("payment");
                leadRepository.save(lead);
            });
        }

        // Auto-generate SalesOrder & Items copy
        com.nexorcrm.backend.entity.SalesOrder so = new com.nexorcrm.backend.entity.SalesOrder();
        so.setLeadId(q.getLeadId());
        so.setQuotationId(q.getId());
        so.setSoNumber("SO-" + System.currentTimeMillis());
        so.setTotalAmount(q.getGrandTotal());
        so.setPaidAmount(BigDecimal.ZERO);
        so.setStatus("AWAITING_ADVANCE");

        List<com.nexorcrm.backend.entity.SalesOrderItem> soItems = new ArrayList<>();
        if (q.getItems() != null) {
            for (QuotationItem qItem : q.getItems()) {
                com.nexorcrm.backend.entity.SalesOrderItem soItem = new com.nexorcrm.backend.entity.SalesOrderItem();
                soItem.setSalesOrder(so);
                soItem.setProductName(qItem.getProductName());
                soItem.setQuantity(qItem.getQuantity());
                soItem.setUnitPrice(qItem.getUnitPrice());
                soItem.setLineTotal(qItem.getLineTotal());
                soItem.setSpecsSummary(qItem.getSpecsSummary());
                soItem.setSpecsJson(qItem.getSpecsJson());
                soItem.setRequirementId(qItem.getRequirementId());
                soItems.add(soItem);
            }
        }
        so.setItems(soItems);
        salesOrderRepository.save(so);

        return toResponse(quotationRepository.save(q));
    }
}
