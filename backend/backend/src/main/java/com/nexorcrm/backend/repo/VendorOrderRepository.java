package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.VendorOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorOrderRepository extends JpaRepository<VendorOrder, Long> {
    List<VendorOrder> findByDeletedFalseOrderByIdDesc();
    List<VendorOrder> findByDeletedFalseAndVendorIdOrderByIdDesc(Long vendorId);
}
