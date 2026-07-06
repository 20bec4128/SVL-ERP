package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.GstMasterRequest;
import com.nexorcrm.backend.dto.GstMasterResponse;
import com.nexorcrm.backend.entity.GstMaster;
import com.nexorcrm.backend.repo.GstMasterRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class GstMasterService {

    private final GstMasterRepository repository;

    public GstMasterService(GstMasterRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<GstMasterResponse> getAll() {
        ensureDefaults();
        return repository.findAllByOrderByTaxPercentAscIdAsc()
                .stream()
                .map(GstMasterResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GstMasterResponse> getActive() {
        ensureDefaults();
        return repository.findByIsActiveTrueOrderByTaxPercentAscIdAsc()
                .stream()
                .map(GstMasterResponse::new)
                .toList();
    }

    @Transactional
    public GstMasterResponse create(GstMasterRequest request) {
        GstMaster entity = new GstMaster();
        apply(entity, request, true);
        return new GstMasterResponse(repository.save(entity));
    }

    @Transactional
    public GstMasterResponse update(Long id, GstMasterRequest request) {
        GstMaster entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("GST master not found: " + id));
        apply(entity, request, false);
        return new GstMasterResponse(repository.save(entity));
    }

    @Transactional
    public void deactivate(Long id) {
        GstMaster entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("GST master not found: " + id));
        entity.setIsActive(false);
        repository.save(entity);
    }

    private void apply(GstMaster entity, GstMasterRequest request, boolean creating) {
        BigDecimal taxPercent = normalizePercent(request == null ? null : request.getTaxPercent());
        if (taxPercent.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Tax percent must be greater than or equal to 0");
        }

        boolean duplicateActivePercent = repository.existsByIsActiveTrueAndTaxPercent(taxPercent)
                && (creating
                || entity.getTaxPercent() == null
                || entity.getTaxPercent().compareTo(taxPercent) != 0
                || !Boolean.TRUE.equals(entity.getIsActive()));
        boolean willBeActive = request == null || request.getIsActive() == null || Boolean.TRUE.equals(request.getIsActive());
        if (duplicateActivePercent && willBeActive) {
            throw new IllegalArgumentException("An active GST master already exists for this tax percent");
        }

        entity.setTaxName(
                StringUtils.hasText(request.getTaxName())
                        ? request.getTaxName().trim()
                        : defaultTaxName(taxPercent)
        );
        entity.setTaxPercent(taxPercent);
        entity.setTaxType(StringUtils.hasText(request.getTaxType()) ? request.getTaxType().trim() : "GST");
        entity.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
    }

    private void ensureDefaults() {
        if (repository.count() > 0) {
            return;
        }
        List<BigDecimal> defaults = List.of(
                new BigDecimal("0"),
                new BigDecimal("5"),
                new BigDecimal("12"),
                new BigDecimal("18"),
                new BigDecimal("28")
        );
        defaults.forEach(percent -> {
            GstMaster entity = new GstMaster();
            entity.setTaxName(defaultTaxName(percent));
            entity.setTaxPercent(percent);
            entity.setTaxType("GST");
            entity.setIsActive(true);
            repository.save(entity);
        });
    }

    private BigDecimal normalizePercent(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private String defaultTaxName(BigDecimal taxPercent) {
        return "GST " + taxPercent.stripTrailingZeros().toPlainString() + "%";
    }
}
