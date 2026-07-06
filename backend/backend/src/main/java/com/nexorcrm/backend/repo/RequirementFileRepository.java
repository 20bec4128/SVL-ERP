package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.RequirementFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequirementFileRepository extends JpaRepository<RequirementFile, Long> {
    List<RequirementFile> findByRequirementId(Long requirementId);

    void deleteByRequirementId(Long requirementId);
}
