package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.SecurityBannedIp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SecurityBannedIpRepository extends JpaRepository<SecurityBannedIp, Long> {
    boolean existsByIpAddress(String ipAddress);

    List<SecurityBannedIp> findAllByOrderByIpAddressAsc();

    @Transactional
    void deleteByIpAddressIn(List<String> ipAddresses);
}
