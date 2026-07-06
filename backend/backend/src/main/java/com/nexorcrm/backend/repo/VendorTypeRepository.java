package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.VendorType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorTypeRepository extends JpaRepository<VendorType, Long> {
    List<VendorType> findByDeletedFalseOrderByIdDesc();
}
