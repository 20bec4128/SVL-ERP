package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.UserDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserDepartmentRepository extends JpaRepository<UserDepartment, Long> {
    List<UserDepartment> findByBranchId(Long branchId);
    List<UserDepartment> findAllByOrderByIdDesc();
}
