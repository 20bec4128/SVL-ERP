package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    List<Brand> findByDeletedFalseOrderByIdDesc();
}
