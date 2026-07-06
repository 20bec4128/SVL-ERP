package com.nexorcrm.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexorcrm.backend.dto.BankDetailDto;
import com.nexorcrm.backend.dto.VendorRequest;
import com.nexorcrm.backend.dto.VendorResponse;
import com.nexorcrm.backend.entity.Vendor;
import com.nexorcrm.backend.repo.VendorRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import java.util.Objects;

@Service
public class VendorService {

    private final VendorRepository repo;
    private final ObjectMapper objectMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public VendorService(VendorRepository repo) {
        this.repo = repo;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional(readOnly = true)
    public List<VendorResponse> listVendors() {
        return repo.findByDeletedFalseOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    public VendorResponse createVendor(VendorRequest req) {
        Vendor v = new Vendor();
        v.setVendorName(req.getVendorName().trim());
        v.setContactPerson(req.getContactPerson());
        v.setPhone(req.getPhone().trim());
        v.setEmail(req.getEmail());
        v.setAddress(req.getAddress());
        v.setMaterialsSupplied(req.getMaterialsSupplied());
        v.setCountryCode(req.getCountryCode());
        
        // Set new fields
        v.setVendorTypeIds(req.getVendorTypeIds());
        v.setProductIds(req.getProductIds());
        v.setBrandIds(req.getBrandIds());
        v.setDealsWith(req.getDealsWith());
        v.setInternalRepresentative(req.getInternalRepresentative());
        v.setRelationshipSince(req.getRelationshipSince());
        v.setCompanyWebsite(req.getCompanyWebsite());
        v.setCountryOfRegistration(req.getCountryOfRegistration());
        v.setCompanyRegistrationNo(req.getCompanyRegistrationNo());
        v.setGstNumber(req.getGstNumber());
        v.setPanNumber(req.getPanNumber());
        v.setCompanyAddress(req.getCompanyAddress());
        v.setStatus(req.getStatus() != null ? req.getStatus() : "active");
        v.setOfficialEmail(req.getOfficialEmail());
        v.setSecondaryEmail(req.getSecondaryEmail());
        v.setBankAccountHolderName(req.getBankAccountHolderName());
        v.setBankName(req.getBankName());
        v.setBankAccountNumber(req.getBankAccountNumber());
        v.setBankIfscCode(req.getBankIfscCode());
        v.setBankBranchName(req.getBankBranchName());
        v.setBankAccountType(req.getBankAccountType());
        v.setBankDetails(serializeBankDetails(req.getBankDetails()));

        if (StringUtils.hasText(req.getUsername())) {
            v.setUsername(req.getUsername().trim());
        }
        if (StringUtils.hasText(req.getPassword())) {
            v.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }

        v = repo.save(v);
        return toResponse(v);
    }

    public VendorResponse updateVendor(Long id, VendorRequest req) {
        Vendor v = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vendor not found"));
        if (v.isDeleted()) throw new EntityNotFoundException("Vendor not found");
        v.setVendorName(req.getVendorName().trim());
        v.setContactPerson(req.getContactPerson());
        v.setPhone(req.getPhone().trim());
        v.setEmail(req.getEmail());
        v.setAddress(req.getAddress());
        v.setMaterialsSupplied(req.getMaterialsSupplied());
        v.setCountryCode(req.getCountryCode());
        
        // Update new fields
        v.setVendorTypeIds(req.getVendorTypeIds());
        v.setProductIds(req.getProductIds());
        v.setBrandIds(req.getBrandIds());
        v.setDealsWith(req.getDealsWith());
        v.setInternalRepresentative(req.getInternalRepresentative());
        v.setRelationshipSince(req.getRelationshipSince());
        v.setCompanyWebsite(req.getCompanyWebsite());
        v.setCountryOfRegistration(req.getCountryOfRegistration());
        v.setCompanyRegistrationNo(req.getCompanyRegistrationNo());
        v.setGstNumber(req.getGstNumber());
        v.setPanNumber(req.getPanNumber());
        v.setCompanyAddress(req.getCompanyAddress());
        v.setStatus(req.getStatus() != null ? req.getStatus() : v.getStatus());
        v.setOfficialEmail(req.getOfficialEmail());
        v.setSecondaryEmail(req.getSecondaryEmail());
        v.setBankAccountHolderName(req.getBankAccountHolderName());
        v.setBankName(req.getBankName());
        v.setBankAccountNumber(req.getBankAccountNumber());
        v.setBankIfscCode(req.getBankIfscCode());
        v.setBankBranchName(req.getBankBranchName());
        v.setBankAccountType(req.getBankAccountType());
        v.setBankDetails(serializeBankDetails(req.getBankDetails()));

        if (StringUtils.hasText(req.getUsername())) {
            v.setUsername(req.getUsername().trim());
        }
        if (StringUtils.hasText(req.getPassword())) {
            v.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }

        v = repo.save(v);
        return toResponse(v);
    }

    public void deleteVendor(Long id) {
        Vendor v = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vendor not found"));
        v.setDeleted(true);
        repo.save(v);
    }

    private VendorResponse toResponse(Vendor v) {
        VendorResponse r = new VendorResponse();
        r.setId(v.getId());
        r.setVendorName(v.getVendorName());
        r.setContactPerson(v.getContactPerson());
        r.setPhone(v.getPhone());
        r.setEmail(v.getEmail());
        r.setAddress(v.getAddress());
        r.setMaterialsSupplied(v.getMaterialsSupplied());
        r.setCountryCode(v.getCountryCode());
        
        // Map new fields
        r.setVendorTypeIds(v.getVendorTypeIds());
        r.setProductIds(v.getProductIds());
        r.setBrandIds(v.getBrandIds());
        r.setDealsWith(v.getDealsWith());
        r.setInternalRepresentative(v.getInternalRepresentative());
        r.setRelationshipSince(v.getRelationshipSince());
        r.setCompanyWebsite(v.getCompanyWebsite());
        r.setCountryOfRegistration(v.getCountryOfRegistration());
        r.setCompanyRegistrationNo(v.getCompanyRegistrationNo());
        r.setGstNumber(v.getGstNumber());
        r.setPanNumber(v.getPanNumber());
        r.setCompanyAddress(v.getCompanyAddress());
        r.setStatus(v.getStatus());
        r.setOfficialEmail(v.getOfficialEmail());
        r.setSecondaryEmail(v.getSecondaryEmail());
        r.setUsername(v.getUsername());
        r.setHasPassword(StringUtils.hasText(v.getPasswordHash()));
        r.setBankAccountHolderName(v.getBankAccountHolderName());
        r.setBankName(v.getBankName());
        r.setBankAccountNumber(v.getBankAccountNumber());
        r.setBankIfscCode(v.getBankIfscCode());
        r.setBankBranchName(v.getBankBranchName());
        r.setBankAccountType(v.getBankAccountType());
        r.setBankDetails(resolveBankDetails(v));

        return r;
    }

    private String serializeBankDetails(List<BankDetailDto> bankDetails) {
        List<BankDetailDto> sanitized = sanitizeBankDetails(bankDetails);
        try {
            return objectMapper.writeValueAsString(sanitized);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Unable to serialize bank details", e);
        }
    }

    private List<BankDetailDto> resolveBankDetails(Vendor vendor) {
        if (StringUtils.hasText(vendor.getBankDetails())) {
            try {
                List<BankDetailDto> parsed = objectMapper.readValue(
                        vendor.getBankDetails(),
                        new TypeReference<List<BankDetailDto>>() {}
                );
                return sanitizeBankDetails(parsed);
            } catch (JsonProcessingException ignored) {
                // Fall through to legacy single-bank fields.
            }
        }

        BankDetailDto legacy = buildLegacyBankDetail(vendor);
        if (legacy == null) {
            return new ArrayList<>();
        }
        List<BankDetailDto> legacyList = new ArrayList<>();
        legacyList.add(legacy);
        return legacyList;
    }

    private BankDetailDto buildLegacyBankDetail(Vendor vendor) {
        if (!StringUtils.hasText(vendor.getBankAccountHolderName())
                && !StringUtils.hasText(vendor.getBankName())
                && !StringUtils.hasText(vendor.getBankAccountNumber())
                && !StringUtils.hasText(vendor.getBankIfscCode())
                && !StringUtils.hasText(vendor.getBankBranchName())
                && !StringUtils.hasText(vendor.getBankAccountType())) {
            return null;
        }

        BankDetailDto dto = new BankDetailDto();
        dto.setBankAccountHolderName(trimToNull(vendor.getBankAccountHolderName()));
        dto.setBankName(trimToNull(vendor.getBankName()));
        dto.setBankAccountNumber(trimToNull(vendor.getBankAccountNumber()));
        dto.setBankIfscCode(trimToNull(vendor.getBankIfscCode()));
        dto.setBankBranchName(trimToNull(vendor.getBankBranchName()));
        dto.setBankAccountType(trimToNull(vendor.getBankAccountType()));
        dto.setUpiId(null);
        dto.setUpiNumber(null);
        dto.setUpiQrImage(null);
        return dto;
    }

    private List<BankDetailDto> sanitizeBankDetails(List<BankDetailDto> bankDetails) {
        if (bankDetails == null || bankDetails.isEmpty()) {
            return new ArrayList<>();
        }

        List<BankDetailDto> sanitized = new ArrayList<>();
        for (BankDetailDto detail : bankDetails) {
            if (detail == null) {
                continue;
            }

            BankDetailDto dto = new BankDetailDto();
            dto.setBankAccountHolderName(trimToNull(detail.getBankAccountHolderName()));
            dto.setBankName(trimToNull(detail.getBankName()));
            dto.setBankAccountNumber(trimToNull(detail.getBankAccountNumber()));
            dto.setBankIfscCode(trimToNull(detail.getBankIfscCode()));
            dto.setBankBranchName(trimToNull(detail.getBankBranchName()));
            dto.setBankAccountType(trimToNull(detail.getBankAccountType()));
            dto.setUpiId(trimToNull(detail.getUpiId()));
            dto.setUpiNumber(trimToNull(detail.getUpiNumber()));
            dto.setUpiQrImage(trimToNull(detail.getUpiQrImage()));

            if (dto.getUpiNumber() != null && !dto.getUpiNumber().matches("\\d{10}")) {
                throw new IllegalArgumentException("UPI number must be exactly 10 digits");
            }

            boolean hasValue = Arrays.asList(
                    dto.getBankAccountHolderName(),
                    dto.getBankName(),
                    dto.getBankAccountNumber(),
                    dto.getBankIfscCode(),
                    dto.getBankBranchName(),
                    dto.getBankAccountType(),
                    dto.getUpiId(),
                    dto.getUpiNumber(),
                    dto.getUpiQrImage()
            ).stream().anyMatch(Objects::nonNull);

            if (hasValue) {
                sanitized.add(dto);
            }
        }
        return sanitized;
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
