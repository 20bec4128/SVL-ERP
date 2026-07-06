package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByDeletedFalseOrderByPromotionDateDesc();
    List<Promotion> findByDeletedFalseAndAppliedFalseAndPromotionDateLessThanEqual(LocalDate date);
}
