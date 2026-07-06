package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.CompanyLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CompanyLocationRepository extends JpaRepository<CompanyLocation, Long> {
    List<CompanyLocation> findByDeletedFalseAndActiveTrueOrderByNameAsc();
    List<CompanyLocation> findByDeletedFalseOrderByNameAsc();
}
