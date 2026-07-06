package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.AddressRequest;
import com.nexorcrm.backend.dto.AddressResponse;
import com.nexorcrm.backend.entity.Address;
import com.nexorcrm.backend.repo.AddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AddressService {

    private final AddressRepository addressRepository;

    public AddressService(AddressRepository addressRepository) {
        this.addressRepository = addressRepository;
    }

    /**
     * Get all addresses for a lead
     */
    public List<AddressResponse> getAddressesByLeadId(Long leadId) {
        return addressRepository.findByLeadIdAndDeletedFalse(leadId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get addresses by lead and type (BILLING or SHIPPING)
     */
    public List<AddressResponse> getAddressesByLeadIdAndType(Long leadId, String type) {
        return addressRepository.findByLeadIdAndTypeAndDeletedFalse(leadId, type)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get a specific address by ID
     */
    public AddressResponse getAddressById(Long addressId) {
        Address address = addressRepository.findByIdAndDeletedFalse(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        return toResponse(address);
    }

    /**
     * Create a new address for a lead
     */
    public AddressResponse createAddress(Long leadId, AddressRequest request) {
        validateAddressRequest(request);

        // If marking as primary, unset primary for other addresses of same type
        if (Boolean.TRUE.equals(request.getIsPrimary())) {
            addressRepository.findByLeadIdAndTypeAndDeletedFalse(leadId, request.getType())
                    .forEach(addr -> {
                        addr.setIsPrimary(false);
                        addressRepository.save(addr);
                    });
        }

        Address address = new Address();
        address.setLeadId(leadId);
        address.setType(normalizeType(request.getType()));
        address.setContactPersonName(request.getContactPersonName());
        address.setCompanyName(request.getCompanyName());
        address.setGstin(request.getGstin());
        address.setCountryCode(request.getCountryCode());
        address.setPhone(normalizePhone(request.getPhone()));
        address.setEmail(request.getEmail());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setCountry(request.getCountry());
        address.setIsPrimary(request.getIsPrimary());

        address = addressRepository.save(address);
        return toResponse(address);
    }

    /**
     * Update an existing address
     */
    public AddressResponse updateAddress(Long addressId, AddressRequest request) {
        validateAddressRequest(request);

        Address address = addressRepository.findByIdAndDeletedFalse(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));

        // If marking as primary, unset primary for other addresses of same type
        if (Boolean.TRUE.equals(request.getIsPrimary()) && !address.getIsPrimary()) {
            addressRepository.findByLeadIdAndTypeAndDeletedFalse(address.getLeadId(), address.getType())
                    .forEach(addr -> {
                        if (!addr.getId().equals(addressId)) {
                            addr.setIsPrimary(false);
                            addressRepository.save(addr);
                        }
                    });
        }

        address.setType(normalizeType(request.getType()));
        address.setContactPersonName(request.getContactPersonName());
        address.setCompanyName(request.getCompanyName());
        address.setGstin(request.getGstin());
        address.setCountryCode(request.getCountryCode());
        address.setPhone(normalizePhone(request.getPhone()));
        address.setEmail(request.getEmail());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setCountry(request.getCountry());
        address.setIsPrimary(request.getIsPrimary());

        address = addressRepository.save(address);
        return toResponse(address);
    }

    /**
     * Delete (soft delete) an address
     */
    public void deleteAddress(Long addressId) {
        Address address = addressRepository.findByIdAndDeletedFalse(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        address.setIsDeleted(true);
        addressRepository.save(address);
    }

    /**
     * Validate address request
     */
    private void validateAddressRequest(AddressRequest request) {
        if (request.getType() == null || (!request.getType().equals("BILLING") && !request.getType().equals("SHIPPING"))) {
            throw new IllegalArgumentException("Address type must be BILLING or SHIPPING");
        }

        if (request.getContactPersonName() == null || request.getContactPersonName().trim().isEmpty()) {
            throw new IllegalArgumentException("Contact person name is required");
        }

        if (request.getPhone() == null || !request.getPhone().matches("^[0-9]{10,15}$")) {
            throw new IllegalArgumentException("Phone number must be 10-15 digits");
        }

        if (request.getGstin() != null && !request.getGstin().isEmpty() && !request.getGstin().matches("^[A-Za-z0-9]{12}$")) {
            throw new IllegalArgumentException("GSTIN must be 12 alphanumeric characters");
        }

        if (request.getAddressLine1() == null || request.getAddressLine1().trim().isEmpty()) {
            throw new IllegalArgumentException("Address line 1 is required");
        }

        if (request.getCity() == null || request.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("City is required");
        }

        if (request.getCountry() == null || request.getCountry().trim().isEmpty()) {
            throw new IllegalArgumentException("Country is required");
        }
    }

    /**
     * Convert entity to response DTO
     */
    private AddressResponse toResponse(Address address) {
        AddressResponse response = new AddressResponse();
        response.setId(address.getId());
        response.setLeadId(address.getLeadId());
        response.setType(address.getType());
        response.setContactPersonName(address.getContactPersonName());
        response.setCompanyName(address.getCompanyName());
        response.setGstin(address.getGstin());
        response.setCountryCode(address.getCountryCode());
        response.setPhone(address.getPhone());
        response.setEmail(address.getEmail());
        response.setAddressLine1(address.getAddressLine1());
        response.setAddressLine2(address.getAddressLine2());
        response.setCity(address.getCity());
        response.setState(address.getState());
        response.setPincode(address.getPincode());
        response.setCountry(address.getCountry());
        response.setIsPrimary(address.getIsPrimary());
        response.setCreatedAt(address.getCreatedAt());
        response.setUpdatedAt(address.getUpdatedAt());
        return response;
    }

    /**
     * Normalize address type to uppercase
     */
    private String normalizeType(String type) {
        return type != null ? type.toUpperCase() : type;
    }

    /**
     * Normalize phone by removing spaces
     */
    private String normalizePhone(String phone) {
        return phone != null ? phone.replaceAll("\\s+", "") : phone;
    }
}
