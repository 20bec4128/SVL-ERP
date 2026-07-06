package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Policy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PolicyRepository extends JpaRepository<Policy, Long> {
    List<Policy> findByDeletedFalseOrderByIdDesc();
}
