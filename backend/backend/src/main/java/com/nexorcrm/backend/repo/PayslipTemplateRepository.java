package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.PayslipTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PayslipTemplateRepository extends JpaRepository<PayslipTemplate, Long> {
    Optional<PayslipTemplate> findTopByOrderByIdAsc();
}
