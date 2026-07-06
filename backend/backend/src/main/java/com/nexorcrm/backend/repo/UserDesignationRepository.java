package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.UserDesignation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserDesignationRepository extends JpaRepository<UserDesignation, Long> {
    List<UserDesignation> findByUserDepartmentId(Long userDepartmentId);
    List<UserDesignation> findAllByOrderByIdDesc();
}
