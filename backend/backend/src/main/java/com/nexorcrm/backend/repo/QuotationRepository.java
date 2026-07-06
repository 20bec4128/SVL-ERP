package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Quotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    List<Quotation> findByLeadIdOrderByCreatedAtDesc(Long leadId);

    List<Quotation> findAllByOrderByCreatedAtDesc();

    List<Quotation> findByCreatedByIdOrderByCreatedAtDesc(Long createdById);

    List<Quotation> findByCreatedByEmailIgnoreCaseOrderByCreatedAtDesc(String createdByEmail);

    List<Quotation> findByLeadIdInOrderByCreatedAtDesc(List<Long> leadIds);

    @Query(value = "SELECT nextval('quotation_number_seq')", nativeQuery = true)
    Long nextQuotationSeq();
}
