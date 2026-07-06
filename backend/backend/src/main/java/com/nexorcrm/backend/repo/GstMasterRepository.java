package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.GstMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface GstMasterRepository extends JpaRepository<GstMaster, Long> {
    List<GstMaster> findAllByOrderByTaxPercentAscIdAsc();
    List<GstMaster> findByIsActiveTrueOrderByTaxPercentAscIdAsc();
    boolean existsByIsActiveTrueAndTaxPercent(BigDecimal taxPercent);
}
