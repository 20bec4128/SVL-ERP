package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.TrainingEmployee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingEmployeeRepository extends JpaRepository<TrainingEmployee, Long> {
    void deleteByTraining_Id(Long trainingId);
}
