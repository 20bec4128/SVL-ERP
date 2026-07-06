package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketCategoryRepository extends JpaRepository<TicketCategory, Long> {
    List<TicketCategory> findByDeletedFalseOrderByIdDesc();
    boolean existsByNameIgnoreCaseAndDeletedFalse(String name);
}
