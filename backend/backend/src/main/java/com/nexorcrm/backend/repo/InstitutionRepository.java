package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstitutionRepository extends JpaRepository<Institution, Long> {
    List<Institution> findByIsDeletedFalseOrderByNameAsc();
    Optional<Institution> findByIdAndIsDeletedFalse(Long id);
    boolean existsByNameIgnoreCaseAndIsDeletedFalse(String name);
    Optional<Institution> findByNameIgnoreCaseAndIsDeletedFalse(String name);
}
