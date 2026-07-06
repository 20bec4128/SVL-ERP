package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByCustomerId(Long customerId);
    List<Invoice> findByLeadId(Long leadId);
    List<Invoice> findBySalesOrderId(Long salesOrderId);
}
