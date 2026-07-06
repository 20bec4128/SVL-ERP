package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;

public interface ServiceTypeRepository extends JpaRepository<ServiceType, Long> {
    List<ServiceType> findByDeletedFalse();
    Page<ServiceType> findByDeletedFalseAndParentIsNull(Pageable pageable);
    Page<ServiceType> findByDeletedFalseAndParentIsNullAndCategory_Id(Long categoryId, Pageable pageable);
    List<ServiceType> findByDeletedFalseAndParentIdIn(Collection<Long> parentIds);
    boolean existsByFieldConfigKeyIgnoreCaseAndDeletedFalse(String fieldConfigKey);
    boolean existsByFieldConfigKeyIgnoreCaseAndDeletedFalseAndIdNot(String fieldConfigKey, Long id);
}
