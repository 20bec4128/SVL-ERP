package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.LeadInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadInvoiceItemRepository extends JpaRepository<LeadInvoiceItem, Long> {
    List<LeadInvoiceItem> findByLeadIdOrderBySortOrderAsc(Long leadId);
    void deleteByLeadId(Long leadId);
}
