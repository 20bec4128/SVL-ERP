package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface JobRepository extends JpaRepository<Job, Long> {
    Optional<Job> findByJobNumber(String jobNumber);
    Optional<Job> findBySalesOrderId(Long salesOrderId);
}
