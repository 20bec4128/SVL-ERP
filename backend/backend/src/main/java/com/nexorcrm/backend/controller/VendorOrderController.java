package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.VendorOrderRequest;
import com.nexorcrm.backend.dto.VendorOrderResponse;
import com.nexorcrm.backend.service.VendorOrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/vendor-orders")
public class VendorOrderController {

    private final VendorOrderService vendorOrderService;

    public VendorOrderController(VendorOrderService vendorOrderService) {
        this.vendorOrderService = vendorOrderService;
    }

    @GetMapping
    public List<VendorOrderResponse> list(@RequestParam(value = "vendorId", required = false) Long vendorId) {
        return vendorOrderService.list(vendorId);
    }

    @PostMapping(consumes = "multipart/form-data")
    public VendorOrderResponse create(
            @Valid @RequestPart("data") VendorOrderRequest request,
            @RequestPart(value = "uploadDesignFile", required = false) MultipartFile uploadDesignFile,
            @RequestPart(value = "quotationFile", required = false) MultipartFile quotationFile,
            @RequestPart(value = "advancePaidProofFile", required = false) MultipartFile advancePaidProofFile
    ) {
        return vendorOrderService.create(request, uploadDesignFile, quotationFile, advancePaidProofFile);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public VendorOrderResponse update(
            @PathVariable Long id,
            @Valid @RequestPart("data") VendorOrderRequest request,
            @RequestPart(value = "uploadDesignFile", required = false) MultipartFile uploadDesignFile,
            @RequestPart(value = "quotationFile", required = false) MultipartFile quotationFile,
            @RequestPart(value = "advancePaidProofFile", required = false) MultipartFile advancePaidProofFile
    ) {
        return vendorOrderService.update(id, request, uploadDesignFile, quotationFile, advancePaidProofFile);
    }
}
