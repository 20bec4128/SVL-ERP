package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findBySoNumber(String soNumber);
    Optional<SalesOrder> findByLeadId(Long leadId);
}
