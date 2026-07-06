package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.UnitMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UnitMasterRepository extends JpaRepository<UnitMaster, Long> {
    List<UnitMaster> findByIsActiveTrueOrderByNameAsc();
    Optional<UnitMaster> findFirstByNameIgnoreCase(String name);
}
