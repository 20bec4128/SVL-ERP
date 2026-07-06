package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ProductFieldConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductFieldConfigRepository extends JpaRepository<ProductFieldConfig, Long> {

    List<ProductFieldConfig> findByServiceTypeIdAndIsActiveTrueOrderByDisplayOrderAsc(Long serviceTypeId);

    Optional<ProductFieldConfig> findByIdAndServiceTypeIdAndIsActiveTrue(Long id, Long serviceTypeId);

    @Query("SELECT MAX(p.displayOrder) FROM ProductFieldConfig p WHERE p.serviceType.id = :serviceTypeId")
    Optional<Integer> findMaxDisplayOrderByServiceTypeId(@Param("serviceTypeId") Long serviceTypeId);
}
