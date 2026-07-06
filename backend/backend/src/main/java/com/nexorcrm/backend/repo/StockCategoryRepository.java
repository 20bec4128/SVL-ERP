package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.StockCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockCategoryRepository extends JpaRepository<StockCategory, Long> {
    List<StockCategory> findByDeletedFalseOrderByIdDesc();
    boolean existsByNameIgnoreCaseAndDeletedFalse(String name);
    boolean existsByIdAndDeletedFalse(Long id);
}
