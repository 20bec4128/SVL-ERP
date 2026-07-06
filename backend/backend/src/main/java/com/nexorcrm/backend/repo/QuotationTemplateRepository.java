package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.QuotationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuotationTemplateRepository extends JpaRepository<QuotationTemplate, Long> {
    Optional<QuotationTemplate> findTopByOrderByIdAsc();
    Optional<QuotationTemplate> findByActiveTrue();
    java.util.List<QuotationTemplate> findAllByOrderByIdAsc();
}
