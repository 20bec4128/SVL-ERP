package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.JobTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobTaskRepository extends JpaRepository<JobTask, Long> {
    List<JobTask> findByJobId(Long jobId);
}
