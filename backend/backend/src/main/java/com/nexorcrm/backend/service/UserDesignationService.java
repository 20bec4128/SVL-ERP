package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.UserDesignationRequest;
import com.nexorcrm.backend.entity.UserDepartment;
import com.nexorcrm.backend.entity.UserDesignation;
import com.nexorcrm.backend.repo.UserDepartmentRepository;
import com.nexorcrm.backend.repo.UserDesignationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserDesignationService {

    private final UserDesignationRepository userDesignationRepository;
    private final UserDepartmentRepository userDepartmentRepository;

    public UserDesignationService(UserDesignationRepository userDesignationRepository,
                                  UserDepartmentRepository userDepartmentRepository) {
        this.userDesignationRepository = userDesignationRepository;
        this.userDepartmentRepository = userDepartmentRepository;
    }

    public List<UserDesignation> getDesignations(Long userDepartmentId) {
        if (userDepartmentId == null) {
            return userDesignationRepository.findAll();
        }
        return userDesignationRepository.findByUserDepartmentId(userDepartmentId);
    }

    public UserDesignation createDesignation(UserDesignationRequest request) {
        UserDepartment dept = userDepartmentRepository.findById(request.getUserDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("User Department not found with ID: " + request.getUserDepartmentId()));

        UserDesignation desig = new UserDesignation();
        desig.setUserDepartment(dept);
        desig.setName(request.getName().trim());
        return userDesignationRepository.save(desig);
    }

    public UserDesignation updateDesignation(Long id, UserDesignationRequest request) {
        UserDesignation desig = userDesignationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User Designation not found with ID: " + id));

        UserDepartment dept = userDepartmentRepository.findById(request.getUserDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("User Department not found with ID: " + request.getUserDepartmentId()));

        desig.setUserDepartment(dept);
        desig.setName(request.getName().trim());
        return userDesignationRepository.save(desig);
    }

    public void deleteDesignation(Long id) {
        if (!userDesignationRepository.existsById(id)) {
            throw new EntityNotFoundException("User Designation not found with ID: " + id);
        }
        userDesignationRepository.deleteById(id);
    }
}
