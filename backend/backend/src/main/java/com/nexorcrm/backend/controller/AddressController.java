package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.AddressRequest;
import com.nexorcrm.backend.dto.AddressResponse;
import com.nexorcrm.backend.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leads/{leadId}/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    /**
     * Get all addresses for a lead
     */
    @GetMapping
    public ResponseEntity<List<AddressResponse>> getAddressesByLead(@PathVariable Long leadId) {
        List<AddressResponse> addresses = addressService.getAddressesByLeadId(leadId);
        return ResponseEntity.ok(addresses);
    }

    /**
     * Get addresses by type (BILLING or SHIPPING)
     */
    @GetMapping(params = "type")
    public ResponseEntity<List<AddressResponse>> getAddressesByType(@PathVariable Long leadId, @RequestParam String type) {
        List<AddressResponse> addresses = addressService.getAddressesByLeadIdAndType(leadId, type);
        return ResponseEntity.ok(addresses);
    }

    /**
     * Create a new address for a lead
     */
    @PostMapping
    public ResponseEntity<AddressResponse> createAddress(@PathVariable Long leadId, @Valid @RequestBody AddressRequest request) {
        try {
            AddressResponse response = addressService.createAddress(leadId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update an existing address
     */
    @PatchMapping("/{addressId}")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable Long leadId,
            @PathVariable Long addressId,
            @Valid @RequestBody AddressRequest request) {
        try {
            AddressResponse response = addressService.updateAddress(addressId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete an address
     */
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Long leadId,
            @PathVariable Long addressId) {
        try {
            addressService.deleteAddress(addressId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get a specific address by ID
     */
    @GetMapping("/{addressId}")
    public ResponseEntity<AddressResponse> getAddressById(
            @PathVariable Long leadId,
            @PathVariable Long addressId) {
        try {
            AddressResponse response = addressService.getAddressById(addressId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
