package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.VendorOrderRequest;
import com.nexorcrm.backend.dto.VendorOrderResponse;
import com.nexorcrm.backend.entity.VendorOrder;
import com.nexorcrm.backend.repo.VendorOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class VendorOrderService {

    private final VendorOrderRepository vendorOrderRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public VendorOrderService(VendorOrderRepository vendorOrderRepository) {
        this.vendorOrderRepository = vendorOrderRepository;
    }

    @Transactional(readOnly = true)
    public List<VendorOrderResponse> list(Long vendorId) {
        List<VendorOrder> orders = vendorId == null
                ? vendorOrderRepository.findByDeletedFalseOrderByIdDesc()
                : vendorOrderRepository.findByDeletedFalseAndVendorIdOrderByIdDesc(vendorId);
        return orders.stream().map(this::toResponse).toList();
    }

    public VendorOrderResponse create(VendorOrderRequest request, MultipartFile uploadDesignFile, MultipartFile quotationFile, MultipartFile advancePaidProofFile) {
        VendorOrder order = new VendorOrder();
        applyRequest(order, request);
        applyFile(order, uploadDesignFile, "vendor-order-designs", true);
        applyFile(order, quotationFile, "vendor-order-quotations", false);
        applyAdvanceProofFile(order, advancePaidProofFile);
        return toResponse(vendorOrderRepository.save(order));
    }

    public VendorOrderResponse update(Long id, VendorOrderRequest request, MultipartFile uploadDesignFile, MultipartFile quotationFile, MultipartFile advancePaidProofFile) {
        VendorOrder order = vendorOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vendor order not found"));
        if (order.isDeleted()) {
            throw new EntityNotFoundException("Vendor order not found");
        }
        applyRequest(order, request);
        applyFile(order, uploadDesignFile, "vendor-order-designs", true);
        applyFile(order, quotationFile, "vendor-order-quotations", false);
        applyAdvanceProofFile(order, advancePaidProofFile);
        return toResponse(vendorOrderRepository.save(order));
    }

    private void applyRequest(VendorOrder order, VendorOrderRequest request) {
        order.setProjectName(request.getProjectName().trim());
        order.setCategoryId(request.getCategoryId());
        order.setCategoryName(request.getCategoryName());
        order.setTypeId(request.getTypeId());
        order.setTypeName(request.getTypeName());
        order.setSubtypeId(request.getSubtypeId());
        order.setSubtypeName(request.getSubtypeName());
        order.setMaterialName(request.getMaterialName());
        order.setVendorId(request.getVendorId());
        order.setVendorName(request.getVendorName());
        order.setQuantity(request.getQuantity());
        order.setRequiredDate(request.getRequiredDate());
        order.setNotes(request.getNotes());
        order.setVendorDeadline(request.getVendorDeadline());
        if (StringUtils.hasText(request.getQuotationFileName())) {
            order.setQuotationFileName(request.getQuotationFileName().trim());
        }
        order.setStatus(StringUtils.hasText(request.getStatus()) ? request.getStatus().trim() : order.getStatus());
        order.setPaymentStatus(StringUtils.hasText(request.getPaymentStatus()) ? request.getPaymentStatus().trim() : order.getPaymentStatus());
        order.setAccountsStatus(StringUtils.hasText(request.getAccountsStatus()) ? request.getAccountsStatus().trim() : order.getAccountsStatus());
        order.setVendorPrice(request.getVendorPrice());
        order.setAdvanceAmount(request.getAdvanceAmount());
        order.setSentToAccountsAt(request.getSentToAccountsAt());
        order.setAdvancePaidAt(request.getAdvancePaidAt());
        order.setAdvanceVerifiedAt(request.getAdvanceVerifiedAt());
        if (request.getAdvancePaidNotes() != null) {
            order.setAdvancePaidNotes(request.getAdvancePaidNotes());
        }
    }

    private void applyAdvanceProofFile(VendorOrder order, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        try {
            Path dir = Path.of(uploadDir, "vendor-order-advance-proofs").toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String originalName = file.getOriginalFilename();
            String safeName = originalName == null ? "file" : Path.of(originalName).getFileName().toString();
            String storedName = UUID.randomUUID() + "_" + safeName;
            Path target = dir.resolve(storedName).normalize();
            if (!target.startsWith(dir)) {
                throw new IllegalStateException("Invalid upload path");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            String relativePath = "uploads/vendor-order-advance-proofs/" + storedName;
            order.setAdvancePaidProofName(safeName);
            order.setAdvancePaidProofPath(relativePath);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload advance payment proof", ex);
        }
    }

    private void applyFile(VendorOrder order, MultipartFile file, String folder, boolean uploadDesign) {
        if (file == null || file.isEmpty()) {
            return;
        }
        try {
            Path dir = Path.of(uploadDir, folder).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String originalName = file.getOriginalFilename();
            String safeName = originalName == null ? "file" : Path.of(originalName).getFileName().toString();
            String storedName = UUID.randomUUID() + "_" + safeName;
            Path target = dir.resolve(storedName).normalize();
            if (!target.startsWith(dir)) {
                throw new IllegalStateException("Invalid upload path");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            String relativePath = "uploads/" + folder + "/" + storedName;
            if (uploadDesign) {
                order.setUploadDesignPath(relativePath);
            } else {
                order.setQuotationFileName(safeName);
                order.setQuotationFilePath(relativePath);
            }
        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload vendor order file", ex);
        }
    }

    private VendorOrderResponse toResponse(VendorOrder order) {
        VendorOrderResponse response = new VendorOrderResponse();
        response.setId(order.getId());
        response.setProjectName(order.getProjectName());
        response.setCategoryId(order.getCategoryId());
        response.setCategoryName(order.getCategoryName());
        response.setTypeId(order.getTypeId());
        response.setTypeName(order.getTypeName());
        response.setSubtypeId(order.getSubtypeId());
        response.setSubtypeName(order.getSubtypeName());
        response.setMaterialName(order.getMaterialName());
        response.setVendorId(order.getVendorId());
        response.setVendorName(order.getVendorName());
        response.setQuantity(order.getQuantity());
        response.setRequiredDate(order.getRequiredDate());
        response.setNotes(order.getNotes());
        response.setUploadDesignPath(order.getUploadDesignPath());
        response.setVendorDeadline(order.getVendorDeadline());
        response.setQuotationFileName(order.getQuotationFileName());
        response.setQuotationFilePath(order.getQuotationFilePath());
        response.setStatus(order.getStatus());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setAccountsStatus(order.getAccountsStatus());
        response.setVendorPrice(order.getVendorPrice());
        response.setAdvanceAmount(order.getAdvanceAmount());
        response.setSentToAccountsAt(order.getSentToAccountsAt());
        response.setAdvancePaidAt(order.getAdvancePaidAt());
        response.setAdvanceVerifiedAt(order.getAdvanceVerifiedAt());
        response.setAdvancePaidProofName(order.getAdvancePaidProofName());
        response.setAdvancePaidProofPath(order.getAdvancePaidProofPath());
        response.setAdvancePaidNotes(order.getAdvancePaidNotes());
        response.setCreatedAt(order.getCreatedAt());
        return response;
    }
}
