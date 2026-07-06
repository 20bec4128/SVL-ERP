package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.HeadOfficeMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HeadOfficeMasterRepository extends JpaRepository<HeadOfficeMaster, Long> {
    List<HeadOfficeMaster> findByDeletedFalseOrderByIdDesc();
    boolean existsByNameIgnoreCaseAndDeletedFalse(String name);
}

