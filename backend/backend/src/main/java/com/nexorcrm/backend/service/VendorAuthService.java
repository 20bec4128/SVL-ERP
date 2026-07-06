package com.nexorcrm.backend.service;

import com.nexorcrm.backend.config.JwtUtil;
import com.nexorcrm.backend.dto.VendorLoginRequest;
import com.nexorcrm.backend.dto.VendorLoginResponse;
import com.nexorcrm.backend.entity.Vendor;
import com.nexorcrm.backend.repo.VendorRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional
public class VendorAuthService {

    private final VendorRepository vendorRepository;
    private final VendorRefreshTokenService vendorRefreshTokenService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public VendorAuthService(VendorRepository vendorRepository,
                             VendorRefreshTokenService vendorRefreshTokenService,
                             JwtUtil jwtUtil) {
        this.vendorRepository = vendorRepository;
        this.vendorRefreshTokenService = vendorRefreshTokenService;
        this.jwtUtil = jwtUtil;
    }

    public VendorLoginResponse login(VendorLoginRequest request) {
        String identifier = request.getIdentifier().trim();
        Vendor vendor = vendorRepository.findByUsernameIgnoreCaseAndDeletedFalse(identifier)
                .or(() -> vendorRepository.findByOfficialEmailIgnoreCaseAndDeletedFalse(identifier))
                .orElseThrow(() -> new BadCredentialsException("Invalid vendor username/email or password"));

        if (!StringUtils.hasText(vendor.getPasswordHash())
                || !passwordEncoder.matches(request.getPassword(), vendor.getPasswordHash())) {
            throw new BadCredentialsException("Invalid vendor username/email or password");
        }

        if ("inactive".equalsIgnoreCase(vendor.getStatus())) {
            throw new BadCredentialsException("Vendor account is inactive");
        }

        String accessToken = jwtUtil.generateVendorAccessToken(vendor);
        String refreshToken = vendorRefreshTokenService.createRefreshToken(vendor).getToken();

        VendorLoginResponse response = new VendorLoginResponse();
        response.setVendorId(vendor.getId());
        response.setVendorName(vendor.getVendorName());
        response.setUsername(vendor.getUsername());
        response.setOfficialEmail(vendor.getOfficialEmail());
        response.setStatus(vendor.getStatus());
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        return response;
    }

    public VendorLoginResponse refreshToken(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            throw new com.nexorcrm.backend.exception.TokenRefreshException();
        }
        Vendor vendor = vendorRefreshTokenService.verifyRefreshToken(refreshToken).getVendor();
        if (vendor == null || vendor.isDeleted()) {
            throw new com.nexorcrm.backend.exception.TokenRefreshException();
        }
        if ("inactive".equalsIgnoreCase(vendor.getStatus())) {
            throw new BadCredentialsException("Vendor account is inactive");
        }

        String accessToken = jwtUtil.generateVendorAccessToken(vendor);
        VendorLoginResponse response = new VendorLoginResponse();
        response.setVendorId(vendor.getId());
        response.setVendorName(vendor.getVendorName());
        response.setUsername(vendor.getUsername());
        response.setOfficialEmail(vendor.getOfficialEmail());
        response.setStatus(vendor.getStatus());
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        return response;
    }

    public String logout(String refreshToken) {
        if (StringUtils.hasText(refreshToken)) {
            vendorRefreshTokenService.revokeRefreshToken(refreshToken);
        }
        return "Logged out successfully";
    }
}
