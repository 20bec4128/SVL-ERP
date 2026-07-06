package com.nexorcrm.backend.service;

import com.nexorcrm.backend.config.JwtUtil;
import com.nexorcrm.backend.entity.Vendor;
import com.nexorcrm.backend.entity.VendorRefreshToken;
import com.nexorcrm.backend.exception.TokenRefreshException;
import com.nexorcrm.backend.repo.VendorRefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class VendorRefreshTokenService {

    private final VendorRefreshTokenRepository vendorRefreshTokenRepository;
    private final JwtUtil jwtUtil;

    @Value("${auth.vendor.refresh-token.expiry-days:30}")
    private long refreshTokenExpiryDays;

    public VendorRefreshTokenService(VendorRefreshTokenRepository vendorRefreshTokenRepository, JwtUtil jwtUtil) {
        this.vendorRefreshTokenRepository = vendorRefreshTokenRepository;
        this.jwtUtil = jwtUtil;
    }

    public VendorRefreshToken createRefreshToken(Vendor vendor) {
        VendorRefreshToken refreshToken = new VendorRefreshToken();
        refreshToken.setVendor(vendor);
        refreshToken.setToken(jwtUtil.generateRefreshToken());
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(refreshTokenExpiryDays));
        refreshToken.setRevoked(false);
        return vendorRefreshTokenRepository.save(refreshToken);
    }

    public VendorRefreshToken verifyRefreshToken(String token) {
        VendorRefreshToken refreshToken = vendorRefreshTokenRepository.findByToken(token)
                .orElseThrow(TokenRefreshException::new);

        if (refreshToken.isRevoked()) {
            throw new TokenRefreshException();
        }

        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            vendorRefreshTokenRepository.delete(refreshToken);
            throw new TokenRefreshException();
        }

        return refreshToken;
    }

    public void revokeRefreshToken(String token) {
        vendorRefreshTokenRepository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevoked(true);
            vendorRefreshTokenRepository.save(refreshToken);
        });
    }

    public void revokeAllVendorTokens(Vendor vendor) {
        vendorRefreshTokenRepository.deleteByVendor(vendor);
    }
}

