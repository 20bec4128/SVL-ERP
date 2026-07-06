package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Vendor;
import com.nexorcrm.backend.entity.VendorRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VendorRefreshTokenRepository extends JpaRepository<VendorRefreshToken, Long> {
    Optional<VendorRefreshToken> findByToken(String token);
    void deleteByVendor(Vendor vendor);
}

