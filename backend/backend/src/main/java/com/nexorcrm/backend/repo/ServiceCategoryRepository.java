package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {
    List<ServiceCategory> findByDeletedFalse();
    Page<ServiceCategory> findByDeletedFalse(Pageable pageable);
}
