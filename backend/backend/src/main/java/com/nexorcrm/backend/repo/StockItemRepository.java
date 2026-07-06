package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockItemRepository extends JpaRepository<StockItem, Long> {
    List<StockItem> findByDeletedFalseOrderByIdDesc();
    List<StockItem> findByCategoryIdAndDeletedFalse(Long categoryId);
}
