package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findByDeletedFalseOrderByIdDesc();
    Optional<Vendor> findByUsernameIgnoreCaseAndDeletedFalse(String username);
    Optional<Vendor> findByOfficialEmailIgnoreCaseAndDeletedFalse(String officialEmail);
}
