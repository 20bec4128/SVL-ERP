package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findBySoNumber(String soNumber);
    List<SalesOrder> findByLeadId(Long leadId);
}
