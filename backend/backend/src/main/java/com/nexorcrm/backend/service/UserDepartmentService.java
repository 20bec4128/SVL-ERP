package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.UserDepartmentRequest;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.entity.UserDepartment;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.UserDepartmentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserDepartmentService {

    private final UserDepartmentRepository userDepartmentRepository;
    private final BranchMasterRepository branchMasterRepository;

    public UserDepartmentService(UserDepartmentRepository userDepartmentRepository,
                                 BranchMasterRepository branchMasterRepository) {
        this.userDepartmentRepository = userDepartmentRepository;
        this.branchMasterRepository = branchMasterRepository;
    }

    public List<UserDepartment> getDepartments(Long branchId) {
        if (branchId == null) {
            return userDepartmentRepository.findAll();
        }
        return userDepartmentRepository.findByBranchId(branchId);
    }

    public UserDepartment createDepartment(UserDepartmentRequest request) {
        BranchMaster branch = branchMasterRepository.findByIdAndDeletedFalse(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found with ID: " + request.getBranchId()));

        UserDepartment dept = new UserDepartment();
        dept.setBranch(branch);
        dept.setName(request.getName().trim());
        return userDepartmentRepository.save(dept);
    }

    public UserDepartment updateDepartment(Long id, UserDepartmentRequest request) {
        UserDepartment dept = userDepartmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User Department not found with ID: " + id));

        BranchMaster branch = branchMasterRepository.findByIdAndDeletedFalse(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found with ID: " + request.getBranchId()));

        dept.setBranch(branch);
        dept.setName(request.getName().trim());
        return userDepartmentRepository.save(dept);
    }

    public void deleteDepartment(Long id) {
        if (!userDepartmentRepository.existsById(id)) {
            throw new EntityNotFoundException("User Department not found with ID: " + id);
        }
        userDepartmentRepository.deleteById(id);
    }
}
