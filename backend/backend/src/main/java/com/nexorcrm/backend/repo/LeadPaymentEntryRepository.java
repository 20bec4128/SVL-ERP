package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.LeadPaymentEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeadPaymentEntryRepository extends JpaRepository<LeadPaymentEntry, Long> {
    List<LeadPaymentEntry> findByLeadId(Long leadId);
    List<LeadPaymentEntry> findBySalesOrderId(Long salesOrderId);
}
