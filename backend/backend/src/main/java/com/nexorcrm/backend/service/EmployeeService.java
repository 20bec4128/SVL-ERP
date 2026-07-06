package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.EmployeeRequest;
import com.nexorcrm.backend.dto.EmployeePageResponse;
import com.nexorcrm.backend.dto.EmployeeResponse;
import com.nexorcrm.backend.dto.EmployeeOnboardRequest;
import com.nexorcrm.backend.entity.DepartmentMaster;
import com.nexorcrm.backend.entity.DesignationMaster;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.EmployeeProfileStatus;
import com.nexorcrm.backend.entity.EmployeeTokenScope;
import com.nexorcrm.backend.entity.LeavePolicy;
import com.nexorcrm.backend.entity.LeavePolicyEmployee;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.EmployeeProfileTokenRepository;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.DesignationMasterRepository;
import com.nexorcrm.backend.repo.LeavePolicyEmployeeRepository;
import com.nexorcrm.backend.repo.LeavePolicyRepository;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.util.PhoneValidationUtil;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.net.URLDecoder;
import java.nio.file.InvalidPathException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.nexorcrm.backend.repo.EmployeeSalaryRepository;
import com.nexorcrm.backend.repo.ProvidentFundRepository;
import com.nexorcrm.backend.entity.ProvidentFund;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final DepartmentMasterRepository departmentMasterRepository;
    private final DesignationMasterRepository designationMasterRepository;
    private final EmployeeProfileTokenRepository employeeProfileTokenRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final ProvidentFundRepository providentFundRepository;
    private final LeavePolicyRepository leavePolicyRepository;
    private final LeavePolicyEmployeeRepository leavePolicyEmployeeRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            DepartmentMasterRepository departmentMasterRepository,
            DesignationMasterRepository designationMasterRepository,
            EmployeeProfileTokenRepository employeeProfileTokenRepository,
            EmployeeSalaryRepository employeeSalaryRepository,
            ProvidentFundRepository providentFundRepository,
            LeavePolicyRepository leavePolicyRepository,
            LeavePolicyEmployeeRepository leavePolicyEmployeeRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.departmentMasterRepository = departmentMasterRepository;
        this.designationMasterRepository = designationMasterRepository;
        this.employeeProfileTokenRepository = employeeProfileTokenRepository;
        this.employeeSalaryRepository = employeeSalaryRepository;
        this.providentFundRepository = providentFundRepository;
        this.leavePolicyRepository = leavePolicyRepository;
        this.leavePolicyEmployeeRepository = leavePolicyEmployeeRepository;
    }

    public List<EmployeeResponse> list() {
        List<Employee> employees = employeeRepository.findByDeletedFalseOrderByIdDesc();

        LocalDateTime now = LocalDateTime.now();
        Map<Long, LocalDateTime> activeUnusedLinkExpiryByEmployeeId = employeeProfileTokenRepository
                .findActiveUnusedLatestTokensForEmployees(
                        employees.stream().map(Employee::getId).toList(),
                        EmployeeTokenScope.MISSING_FIELDS,
                        now
                )
                .stream()
                .collect(Collectors.toMap(
                        t -> t.getEmployeeId(),
                        t -> t.getExpiresAt(),
                        (a, b) -> a
                ));

        return employees.stream()
                .map(e -> toResponse(e, activeUnusedLinkExpiryByEmployeeId.get(e.getId())))
                .toList();
    }

    public EmployeePageResponse list(
            Integer page,
            Integer size,
            Long headOfficeId,
            Long branchId,
            Long departmentId,
            Long designationId,
            String profileStatus,
            String q,
            String sortField,
            String sortOrder
    ) {
        int safePage = Math.max(page == null ? 1 : page, 1);
        int safeSize = Math.max(size == null ? 25 : size, 1);

        Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String entitySortField = "id";
        if ("name".equalsIgnoreCase(sortField)) {
            entitySortField = "name";
        } else if ("phone".equalsIgnoreCase(sortField)) {
            entitySortField = "phone";
        } else if ("dept".equalsIgnoreCase(sortField)) {
            entitySortField = "dept";
        } else if ("designation".equalsIgnoreCase(sortField)) {
            entitySortField = "designation";
        } else if ("joinDate".equalsIgnoreCase(sortField)) {
            entitySortField = "joinDate";
        } else if ("status".equalsIgnoreCase(sortField)) {
            entitySortField = "status";
        } else if ("employeeCode".equalsIgnoreCase(sortField)) {
            entitySortField = "employeeCode";
        }

        Pageable pageable = PageRequest.of(safePage - 1, safeSize, Sort.by(direction, entitySortField));

        Specification<Employee> spec = Specification.where((root, query, cb) -> cb.isFalse(root.get("deleted")));
        if (headOfficeId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("headOfficeId"), headOfficeId));
        }
        if (branchId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("branchId"), branchId));
        }
        if (departmentId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("departmentMasterId"), departmentId));
        }
        if (designationId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("designationMasterId"), designationId));
        }
        if (profileStatus != null && !profileStatus.isBlank()) {
            try {
                EmployeeProfileStatus status = EmployeeProfileStatus.valueOf(profileStatus.trim().toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("profileStatus"), status));
            } catch (IllegalArgumentException ignored) {
                // Ignore invalid profile status values and return the unfiltered set.
            }
        }
        if (q != null && !q.isBlank()) {
            String searchPattern = "%" + q.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), searchPattern),
                cb.like(cb.lower(root.get("phone")), searchPattern),
                cb.like(cb.lower(root.get("email")), searchPattern),
                cb.like(cb.lower(root.get("employeeCode")), searchPattern)
            ));
        }

        Page<Employee> employeePage = employeeRepository.findAll(spec, pageable);
        List<Employee> employees = employeePage.getContent();

        LocalDateTime now = LocalDateTime.now();
        Map<Long, LocalDateTime> activeUnusedLinkExpiryByEmployeeId = employeeProfileTokenRepository
                .findActiveUnusedLatestTokensForEmployees(
                        employees.stream().map(Employee::getId).toList(),
                        EmployeeTokenScope.MISSING_FIELDS,
                        now
                )
                .stream()
                .collect(Collectors.toMap(
                        t -> t.getEmployeeId(),
                        t -> t.getExpiresAt(),
                        (a, b) -> a
                ));

        List<EmployeeResponse> content = employees.stream()
                .map(e -> toResponse(e, activeUnusedLinkExpiryByEmployeeId.get(e.getId())))
                .toList();

        return new EmployeePageResponse(
                content,
                employeePage.getNumber() + 1,
                employeePage.getSize(),
                employeePage.getTotalElements(),
                Math.max(1, employeePage.getTotalPages())
        );
    }

    public List<EmployeeResponse> getAvailableEmployees(
            Long headOfficeId,
            Long branchId,
            Long departmentId,
            Long designationId,
            String institution,
            String department,
            String team
    ) {
        try {
            Long normalizedHeadOfficeId = headOfficeId;
            Long normalizedBranchId = branchId;
            Long normalizedDepartmentId = departmentId;
            Long normalizedDesignationId = designationId;
            String normalizedInstitution = trimToNull(institution);
            String normalizedDepartment = trimToNull(department);
            String normalizedTeam = trimToNull(team);

            // Only active users should block an employee from appearing in the dropdown.
            Set<String> userEmails = userRepository.findByIsDeletedFalse()
                    .stream()
                    .filter(User::isActive)
                    .filter(user -> user.getActivationStatus() == ActivationStatus.ACTIVE)
                    .filter(user -> user.getEmail() != null && !user.getEmail().trim().isEmpty())
                    .map(user -> user.getEmail().toLowerCase().trim())
                    .collect(Collectors.toSet());

            // Get all non-deleted verified employees and filter out those with existing user accounts
            return employeeRepository.findByDeletedFalseOrderByIdDesc()
                    .stream()
                    .filter(emp -> emp.getProfileStatus() == EmployeeProfileStatus.VERIFIED)
                    .filter(emp -> resolveEmployeeEmail(emp) != null)
                    .filter(emp -> !userEmails.contains(resolveEmployeeEmail(emp)))
                    .filter(emp -> matchesHeadOfficeId(emp.getHeadOfficeId(), normalizedHeadOfficeId))
                    .filter(emp -> matchesId(emp.getBranchId(), normalizedBranchId))
                    .filter(emp -> matchesId(emp.getDepartmentMasterId(), normalizedDepartmentId))
                    .filter(emp -> matchesId(emp.getDesignationMasterId(), normalizedDesignationId))
                    .filter(emp -> matchesScope(emp.getInstitution(), normalizedInstitution))
                    .filter(emp -> matchesScope(emp.getDepartmentName(), normalizedDepartment))
                    .filter(emp -> matchesScope(emp.getTeam(), normalizedTeam))
                    .map(this::toResponse)
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            // Return empty list on error instead of throwing, to prevent HTML error pages
            return List.of();
        }
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        validatePhoneNumber(request);
        Employee e = new Employee();
        apply(e, request);
        e = employeeRepository.save(e);

        if (e.getEmployeeCode() == null || e.getEmployeeCode().isBlank()) {
            e.setEmployeeCode(String.format("Emp-%03d", e.getId()));
            e = employeeRepository.save(e);
        }

        syncEmployeeLeavePolicies(e.getId(), request.getLeavePolicyIds(), request.getLeavePolicyIds() != null);
        return toResponse(e);
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeRequest request) {
        validatePhoneNumber(request);
        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        if (Boolean.TRUE.equals(e.getDeleted())) {
            throw new EntityNotFoundException("Employee not found");
        }

        apply(e, request);
        e = employeeRepository.save(e);
        syncEmployeeLeavePolicies(e.getId(), request.getLeavePolicyIds(), request.getLeavePolicyIds() != null);
        return toResponse(e);
    }

    public EmployeeResponse getById(Long id) {
        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        if (Boolean.TRUE.equals(e.getDeleted())) {
            throw new EntityNotFoundException("Employee not found");
        }
        LocalDateTime offerLetterLinkExpiresAt = employeeProfileTokenRepository
                .findActiveUnusedLatestTokensForEmployees(
                        List.of(e.getId()),
                        EmployeeTokenScope.MISSING_FIELDS,
                        LocalDateTime.now()
                )
                .stream()
                .findFirst()
                .map(token -> token.getExpiresAt())
                .orElse(null);
        return toResponse(e, offerLetterLinkExpiresAt);
    }

    @Transactional
    public EmployeeResponse onboard(EmployeeOnboardRequest request) {
        Employee e = new Employee();
        applyOnboard(e, request);
        e = employeeRepository.save(e);

        if (e.getEmployeeCode() == null || e.getEmployeeCode().isBlank()) {
            e.setEmployeeCode(String.format("Emp-%03d", e.getId()));
            e = employeeRepository.save(e);
        }

        applyOnboardFiles(e, request);
        e = employeeRepository.save(e);
        syncEmployeeSalary(e);
        syncEmployeeLeavePolicies(e.getId(), request.getLeavePolicyIds(), Boolean.TRUE.equals(request.getLeavePolicyIdsProvided()));
        return toResponse(e);
    }

    @Transactional
    public EmployeeResponse onboardUpdate(Long id, EmployeeOnboardRequest request) {
        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        if (Boolean.TRUE.equals(e.getDeleted())) {
            throw new EntityNotFoundException("Employee not found");
        }

        applyOnboard(e, request);
        applyOnboardFilesUpdate(e, request);
        e = employeeRepository.save(e);
        syncEmployeeSalary(e);
        syncEmployeeLeavePolicies(e.getId(), request.getLeavePolicyIds(), Boolean.TRUE.equals(request.getLeavePolicyIdsProvided()));
        return toResponse(e);
    }

    public void delete(Long id) {
        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        e.setDeleted(true);
        employeeRepository.save(e);
    }

    private void syncEmployeeLeavePolicies(Long employeeId, List<Long> leavePolicyIds, boolean replaceRequested) {
        if (!replaceRequested || employeeId == null) return;

        leavePolicyEmployeeRepository.deleteByEmployeeId(employeeId);
        if (leavePolicyIds == null || leavePolicyIds.isEmpty()) return;

        LinkedHashSet<Long> uniquePolicyIds = leavePolicyIds.stream()
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (uniquePolicyIds.isEmpty()) return;

        List<LeavePolicy> policies = leavePolicyRepository.findAllById(uniquePolicyIds);
        Map<Long, LeavePolicy> policyById = policies.stream()
                .filter(policy -> !Boolean.TRUE.equals(policy.getDeleted()))
                .collect(Collectors.toMap(LeavePolicy::getId, Function.identity()));

        List<Long> invalidPolicyIds = uniquePolicyIds.stream()
                .filter(policyId -> !policyById.containsKey(policyId))
                .toList();
        if (!invalidPolicyIds.isEmpty()) {
            throw new EntityNotFoundException("Leave policy not found: " + invalidPolicyIds.get(0));
        }

        List<LeavePolicyEmployee> rows = new ArrayList<>();
        for (Long policyId : uniquePolicyIds) {
            LeavePolicyEmployee row = new LeavePolicyEmployee();
            row.setPolicy(policyById.get(policyId));
            row.setEmployeeId(employeeId);
            rows.add(row);
        }
        leavePolicyEmployeeRepository.saveAll(rows);
    }

    private List<Long> getEmployeeLeavePolicyIds(Long employeeId) {
        if (employeeId == null) return List.of();
        return leavePolicyEmployeeRepository.findByEmployeeId(employeeId)
                .stream()
                .filter(row -> row.getPolicy() != null && !Boolean.TRUE.equals(row.getPolicy().getDeleted()))
                .map(row -> row.getPolicy().getId())
                .toList();
    }

    private void validatePhoneNumber(EmployeeRequest request) {
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String countryCode = request.getCountryCode();
            String errorMessage = PhoneValidationUtil.validatePhoneNumber(request.getPhone(), countryCode);
            if (!errorMessage.isEmpty()) {
                throw new IllegalArgumentException(errorMessage);
            }
        }
    }

    private void apply(Employee e, EmployeeRequest r) {
        e.setName(r.getName());
        e.setEmail(r.getEmail());
        
        // Set and normalize country code
        String countryCode = r.getCountryCode();
        e.setCountryCode(PhoneValidationUtil.ensureCountryCodeValue(countryCode));
        
        e.setPhone(r.getPhone());
        e.setDept(r.getDept());
        e.setInstitution(trimToNull(r.getInstitution()));
        e.setDepartmentName(firstNonBlank(r.getUserDepartmentName(), r.getDepartmentName()));
        e.setTeam(trimToNull(r.getTeam()));
        e.setDesignation(r.getDesignation());
        e.setHeadOfficeId(r.getHeadOfficeId());
        e.setBranchId(r.getBranchId());
        e.setDepartmentMasterId(r.getDepartmentMasterId());
        e.setDesignationMasterId(r.getDesignationMasterId());
        e.setEmployeeIdNumber(trimToNull(r.getEmployeeIdNumber()));
        e.setFatherName(trimToNull(r.getFatherName()));
        e.setMotherName(trimToNull(r.getMotherName()));
        e.setPersonalContactNumber(trimToNull(r.getPersonalContactNumber()));
        e.setAlternateContactNumber(trimToNull(r.getAlternateContactNumber()));
        e.setLocation(trimToNull(r.getLocation()));
        e.setPinCode(trimToNull(r.getPinCode()));
        e.setState(trimToNull(r.getState()));
        e.setCurrentAddress(trimToNull(r.getCurrentAddress()));
        e.setPermanentAddress(trimToNull(r.getPermanentAddress()));
        e.setPersonalEmail(trimToNull(r.getPersonalEmail()));
        e.setOfficialEmail(trimToNull(r.getOfficialEmail()));
        e.setDateOfBirth(r.getDateOfBirth());
        e.setMaritalStatus(trimToNull(r.getMaritalStatus()));
        e.setSpouseName(trimToNull(r.getSpouseName()));
        e.setBloodGroup(trimToNull(r.getBloodGroup()));
        e.setPanCardNo(trimToNull(r.getPanCardNo()));
        e.setAadharCardNo(trimToNull(r.getAadharCardNo()));
        e.setBankAccountHolderName(trimToNull(r.getBankAccountHolderName()));
        e.setBankAccountNumber(trimToNull(r.getBankAccountNumber()));
        e.setIfscCode(trimToNull(r.getIfscCode()));
        e.setBankAndBranch(trimToNull(r.getBankAndBranch()));
        setIfPresent(r.getEmploymentDetails1(), e::setEmploymentDetails1);
        setIfPresent(r.getEmploymentDetails2(), e::setEmploymentDetails2);
        setIfPresent(r.getPreviousEmploymentJoiningDate(), e::setPreviousEmploymentJoiningDate);
        setIfPresent(r.getPreviousEmploymentRelievingDate(), e::setPreviousEmploymentRelievingDate);
        setIfPresent(r.getPreviousEmploymentSalaryAtJoining(), e::setPreviousEmploymentSalaryAtJoining);
        setIfPresent(r.getPreviousEmploymentSalaryAtRelieving(), e::setPreviousEmploymentSalaryAtRelieving);
        setIfPresent(r.getPreviousEmploymentRelievedWithNoticePeriod(), e::setPreviousEmploymentRelievedWithNoticePeriod);
        setIfPresent(r.getPreviousEmploymentAbsconded(), e::setPreviousEmploymentAbsconded);
        setIfPresent(r.getPreviousEmploymentDesignationAtJoining(), e::setPreviousEmploymentDesignationAtJoining);
        setIfPresent(r.getPreviousEmploymentDesignationAtRelieving(), e::setPreviousEmploymentDesignationAtRelieving);
        setIfPresent(r.getPreviousEmploymentManagerName(), e::setPreviousEmploymentManagerName);
        setIfPresent(r.getPreviousEmploymentManagerMobileNumber(), e::setPreviousEmploymentManagerMobileNumber);
        setIfPresent(r.getPreviousEmploymentCompanyAddress(), e::setPreviousEmploymentCompanyAddress);
        setIfPresent(r.getGraduationDetails(), e::setGraduationDetails);
        setIfPresent(r.getHscMarkAndYear(), e::setHscMarkAndYear);
        setIfPresent(r.getSslcMarkAndYear(), e::setSslcMarkAndYear);
        e.setEducationQualification(trimToNull(r.getEducationQualification()));
        e.setEducationCourseName(trimToNull(r.getEducationCourseName()));
        e.setEducationCertificateNumber(trimToNull(r.getEducationCertificateNumber()));
        e.setEducationRollNumber(trimToNull(r.getEducationRollNumber()));
        e.setEducationMark(trimToNull(r.getEducationMark()));
        e.setEducationMaxMark(trimToNull(r.getEducationMaxMark()));
        e.setEducationMarkPercentage(calculateEducationPercentage(r.getEducationMark(), r.getEducationMaxMark(), r.getEducationMarkPercentage()));
        e.setEducationFromYear(trimToNull(r.getEducationFromYear()));
        e.setEducationToYear(trimToNull(r.getEducationToYear()));
        e.setEmergencyContactName1(trimToNull(r.getEmergencyContactName1()));
        e.setEmergencyContactRelation1(trimToNull(r.getEmergencyContactRelation1()));
        e.setEmergencyContactPhone1(trimToNull(r.getEmergencyContactPhone1()));
        e.setEmergencyContactName2(trimToNull(r.getEmergencyContactName2()));
        e.setEmergencyContactRelation2(trimToNull(r.getEmergencyContactRelation2()));
        e.setEmergencyContactPhone2(trimToNull(r.getEmergencyContactPhone2()));
        e.setFriendRefName1(trimToNull(r.getFriendRefName1()));
        e.setFriendRefContact1(trimToNull(r.getFriendRefContact1()));
        e.setFriendRefName2(trimToNull(r.getFriendRefName2()));
        e.setFriendRefContact2(trimToNull(r.getFriendRefContact2()));
        e.setBranchToJoin(trimToNull(r.getBranchToJoin()));
        e.setPlatformSource(trimToNull(r.getPlatformSource()));
        e.setPfUan(trimToNull(r.getPfUan()));
        e.setEsiNo(trimToNull(r.getEsiNo()));
        e.setDeclarationDate(r.getDeclarationDate());
        e.setDeclarationPlace(trimToNull(r.getDeclarationPlace()));
        e.setCandidatePhotoPath(trimToNull(r.getCandidatePhotoPath()));
        e.setAadharCardPath(trimToNull(r.getAadharCardPath()));
        e.setPanCardPath(trimToNull(r.getPanCardPath()));
        e.setBankPassbookPath(trimToNull(r.getBankPassbookPath()));
        e.setExperienceCertificatePath(trimToNull(r.getExperienceCertificatePath()));
        e.setCertificatePath(trimToNull(r.getCertificatePath()));
        e.setGraduationCertificatePath(trimToNull(r.getGraduationCertificatePath()));
        e.setGraduationMarksheetPath(trimToNull(r.getGraduationMarksheetPath()));
        e.setHscMarksheetPath(trimToNull(r.getHscMarksheetPath()));
        e.setSslcMarksheetPath(trimToNull(r.getSslcMarksheetPath()));
        e.setCommunityCertificatePath(trimToNull(r.getCommunityCertificatePath()));
        e.setJoinDate(r.getJoinDate());
        e.setStatus(normalizeStatus(r.getStatus()));
        e.setImg((r.getImg() == null || r.getImg().isBlank()) ? "assets/img/users/user-32.jpg" : r.getImg());
    }

    private void applyOnboard(Employee e, EmployeeOnboardRequest r) {
        e.setName(trimToNull(r.getNameInCaps()) == null ? "" : r.getNameInCaps().trim().toUpperCase());
        e.setDesignation(trimToNull(r.getDesignation()));
        e.setEmployeeIdNumber(trimToNull(r.getEmployeeIdNumber()));
        e.setFatherName(trimToNull(r.getFatherName()));
        e.setMotherName(trimToNull(r.getMotherName()));
        e.setPersonalContactNumber(trimToNull(r.getPersonalContactNumber()));
        e.setAlternateContactNumber(trimToNull(r.getAlternateContactNumber()));
        e.setLocation(trimToNull(r.getLocation()));
        e.setPinCode(trimToNull(r.getPinCode()));
        e.setState(trimToNull(r.getState()));
        e.setCurrentAddress(trimToNull(r.getCurrentAddress()));
        e.setPermanentAddress(trimToNull(r.getPermanentAddress()));
        e.setPersonalEmail(trimToNull(r.getPersonalEmail()));
        e.setOfficialEmail(trimToNull(r.getOfficialEmail()));
        e.setDateOfBirth(r.getDateOfBirth());
        e.setJoinDate(r.getDateOfJoining());
        e.setMaritalStatus(trimToNull(r.getMaritalStatus()));
        e.setSpouseName(trimToNull(r.getSpouseName()));
        e.setBloodGroup(trimToNull(r.getBloodGroup()));
        e.setPanCardNo(trimToNull(r.getPanCardNo()));
        e.setAadharCardNo(trimToNull(r.getAadharCardNo()));
        e.setBankAccountHolderName(trimToNull(r.getBankAccountHolderName()));
        e.setBankAccountNumber(trimToNull(r.getBankAccountNumber()));
        e.setIfscCode(trimToNull(r.getIfscCode()));
        e.setBankAndBranch(trimToNull(r.getBankAndBranch()));
        setIfPresent(r.getEmploymentDetails1(), e::setEmploymentDetails1);
        setIfPresent(r.getEmploymentDetails2(), e::setEmploymentDetails2);
        setIfPresent(r.getPreviousEmploymentJoiningDate(), e::setPreviousEmploymentJoiningDate);
        setIfPresent(r.getPreviousEmploymentRelievingDate(), e::setPreviousEmploymentRelievingDate);
        setIfPresent(r.getPreviousEmploymentSalaryAtJoining(), e::setPreviousEmploymentSalaryAtJoining);
        setIfPresent(r.getPreviousEmploymentSalaryAtRelieving(), e::setPreviousEmploymentSalaryAtRelieving);
        setIfPresent(r.getPreviousEmploymentRelievedWithNoticePeriod(), e::setPreviousEmploymentRelievedWithNoticePeriod);
        setIfPresent(r.getPreviousEmploymentAbsconded(), e::setPreviousEmploymentAbsconded);
        setIfPresent(r.getPreviousEmploymentDesignationAtJoining(), e::setPreviousEmploymentDesignationAtJoining);
        setIfPresent(r.getPreviousEmploymentDesignationAtRelieving(), e::setPreviousEmploymentDesignationAtRelieving);
        setIfPresent(r.getPreviousEmploymentManagerName(), e::setPreviousEmploymentManagerName);
        setIfPresent(r.getPreviousEmploymentManagerMobileNumber(), e::setPreviousEmploymentManagerMobileNumber);
        setIfPresent(r.getPreviousEmploymentCompanyAddress(), e::setPreviousEmploymentCompanyAddress);
        setIfPresent(r.getGraduationDetails(), e::setGraduationDetails);
        setIfPresent(r.getHscMarkAndYear(), e::setHscMarkAndYear);
        setIfPresent(r.getSslcMarkAndYear(), e::setSslcMarkAndYear);
        e.setEducationQualification(trimToNull(r.getEducationQualification()));
        e.setEducationCourseName(trimToNull(r.getEducationCourseName()));
        e.setEducationCertificateNumber(trimToNull(r.getEducationCertificateNumber()));
        e.setEducationRollNumber(trimToNull(r.getEducationRollNumber()));
        e.setEducationMark(trimToNull(r.getEducationMark()));
        e.setEducationMaxMark(trimToNull(r.getEducationMaxMark()));
        e.setEducationMarkPercentage(calculateEducationPercentage(r.getEducationMark(), r.getEducationMaxMark(), r.getEducationMarkPercentage()));
        e.setEducationFromYear(trimToNull(r.getEducationFromYear()));
        e.setEducationToYear(trimToNull(r.getEducationToYear()));
        e.setEmergencyContactName1(trimToNull(r.getEmergencyContactName1()));
        e.setEmergencyContactRelation1(trimToNull(r.getEmergencyContactRelation1()));
        e.setEmergencyContactPhone1(trimToNull(r.getEmergencyContactPhone1()));
        e.setEmergencyContactName2(trimToNull(r.getEmergencyContactName2()));
        e.setEmergencyContactRelation2(trimToNull(r.getEmergencyContactRelation2()));
        e.setEmergencyContactPhone2(trimToNull(r.getEmergencyContactPhone2()));
        e.setFriendRefName1(trimToNull(r.getFriendRefName1()));
        e.setFriendRefContact1(trimToNull(r.getFriendRefContact1()));
        e.setFriendRefName2(trimToNull(r.getFriendRefName2()));
        e.setFriendRefContact2(trimToNull(r.getFriendRefContact2()));
        e.setBranchToJoin(trimToNull(r.getBranchToJoin()));
        e.setPlatformSource(trimToNull(r.getPlatformSource()));
        e.setPfUan(trimToNull(r.getPfUan()));
        e.setEsiNo(trimToNull(r.getEsiNo()));
        e.setDeclarationDate(r.getDeclarationDate());
        e.setDeclarationPlace(trimToNull(r.getDeclarationPlace()));
        e.setHeadOfficeId(r.getHeadOfficeId());
        e.setBranchId(r.getBranchId());
        e.setDepartmentMasterId(r.getDepartmentMasterId());
        e.setDesignationMasterId(r.getDesignationMasterId());

        // Derive display fields used by listings/legacy UI.
        if (r.getDepartmentMasterId() != null) {
            DepartmentMaster dept = departmentMasterRepository.findById(r.getDepartmentMasterId()).orElse(null);
            if (dept != null && Boolean.FALSE.equals(dept.getDeleted())) {
                e.setDepartmentName(dept.getName());
                // keep dept (legacy) aligned for existing screens
                e.setDept(dept.getName());
            }
        }

        if (r.getDesignationMasterId() != null) {
            DesignationMaster desig = designationMasterRepository.findById(r.getDesignationMasterId()).orElse(null);
            if (desig != null && Boolean.FALSE.equals(desig.getDeleted())) {
                e.setDesignation(desig.getName());
            }
        }

        e.setStatus("ACTIVE");
        if (e.getImg() == null || e.getImg().isBlank()) {
            e.setImg("assets/img/users/user-32.jpg");
        }

        e.setBasic(r.getBasic() != null ? r.getBasic() : BigDecimal.ZERO);
        e.setDa(r.getDa() != null ? r.getDa() : BigDecimal.ZERO);
        e.setHra(r.getHra() != null ? r.getHra() : BigDecimal.ZERO);
        e.setConveyance(r.getConveyance() != null ? r.getConveyance() : BigDecimal.ZERO);
        e.setTds(r.getTds() != null ? r.getTds() : BigDecimal.ZERO);
        e.setEsi(r.getEsi() != null ? r.getEsi() : BigDecimal.ZERO);
        e.setPf(r.getPf() != null ? r.getPf() : BigDecimal.ZERO);
        e.setLeaveDeduction(r.getLeaveDeduction() != null ? r.getLeaveDeduction() : BigDecimal.ZERO);
        e.setNetSalary(r.getNetSalary() != null ? r.getNetSalary() : BigDecimal.ZERO);
    }

    private void applyOnboardFiles(Employee e, EmployeeOnboardRequest r) {
        Long employeeId = e.getId();
        if (employeeId == null) {
            return;
        }
        e.setCandidatePhotoPath(saveEmployeeFile(employeeId, "candidate-photo", r.getCandidatePhoto()));
        e.setAadharCardPath(saveEmployeeFile(employeeId, "aadhar-card", r.getUploadCandidateAadharCard()));
        e.setPanCardPath(saveEmployeeFile(employeeId, "pan-card", r.getUploadCandidatePanCard()));
        e.setBankPassbookPath(saveEmployeeFile(employeeId, "bank-passbook", r.getUploadBankPassBookCopy()));
        e.setExperienceCertificatePath(saveEmployeeFile(employeeId, "experience-certificate", r.getUploadExperienceCertificate()));
        e.setCertificatePath(saveEmployeeFile(employeeId, "certificate", r.getUploadCertificate()));
        e.setGraduationCertificatePath(saveEmployeeFile(employeeId, "graduation-certificate", r.getUploadGraduationCertificate()));
        e.setGraduationMarksheetPath(saveEmployeeFile(employeeId, "graduation-marksheet", r.getUploadGraduationMarksheet()));
        e.setHscMarksheetPath(saveEmployeeFile(employeeId, "hsc-marksheet", r.getUploadHscMarkSheet()));
        e.setSslcMarksheetPath(saveEmployeeFile(employeeId, "sslc-marksheet", r.getUploadSslcMarkSheet()));
        e.setCommunityCertificatePath(saveEmployeeFile(employeeId, "community-certificate", r.getUploadCommunityCertificate()));
    }

    private void applyOnboardFilesUpdate(Employee e, EmployeeOnboardRequest r) {
        Long employeeId = e.getId();
        if (employeeId == null) {
            return;
        }
        String candidatePhotoPath = saveEmployeeFile(employeeId, "candidate-photo", r.getCandidatePhoto());
        if (candidatePhotoPath != null) e.setCandidatePhotoPath(candidatePhotoPath);

        String aadharCardPath = saveEmployeeFile(employeeId, "aadhar-card", r.getUploadCandidateAadharCard());
        if (aadharCardPath != null) e.setAadharCardPath(aadharCardPath);

        String panCardPath = saveEmployeeFile(employeeId, "pan-card", r.getUploadCandidatePanCard());
        if (panCardPath != null) e.setPanCardPath(panCardPath);

        String bankPassbookPath = saveEmployeeFile(employeeId, "bank-passbook", r.getUploadBankPassBookCopy());
        if (bankPassbookPath != null) e.setBankPassbookPath(bankPassbookPath);

        String expCertPath = saveEmployeeFile(employeeId, "experience-certificate", r.getUploadExperienceCertificate());
        if (expCertPath != null) e.setExperienceCertificatePath(expCertPath);

        String certPath = saveEmployeeFile(employeeId, "certificate", r.getUploadCertificate());
        if (certPath != null) e.setCertificatePath(certPath);

        String gradCertPath = saveEmployeeFile(employeeId, "graduation-certificate", r.getUploadGraduationCertificate());
        if (gradCertPath != null) e.setGraduationCertificatePath(gradCertPath);

        String gradMarkPath = saveEmployeeFile(employeeId, "graduation-marksheet", r.getUploadGraduationMarksheet());
        if (gradMarkPath != null) e.setGraduationMarksheetPath(gradMarkPath);

        String hscMarkPath = saveEmployeeFile(employeeId, "hsc-marksheet", r.getUploadHscMarkSheet());
        if (hscMarkPath != null) e.setHscMarksheetPath(hscMarkPath);

        String sslcMarkPath = saveEmployeeFile(employeeId, "sslc-marksheet", r.getUploadSslcMarkSheet());
        if (sslcMarkPath != null) e.setSslcMarksheetPath(sslcMarkPath);

        String commCertPath = saveEmployeeFile(employeeId, "community-certificate", r.getUploadCommunityCertificate());
        if (commCertPath != null) e.setCommunityCertificatePath(commCertPath);
    }

    private String saveEmployeeFile(Long employeeId, String kind, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            Path dir = Path.of(uploadDir, "employees", String.valueOf(employeeId), kind).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String originalName = file.getOriginalFilename();
            String safeName = originalName == null ? "file" : Path.of(originalName).getFileName().toString();
            String storedName = UUID.randomUUID() + "_" + safeName;
            Path target = dir.resolve(storedName).normalize();
            if (!target.startsWith(dir)) {
                throw new IllegalStateException("Invalid upload path");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return Path.of("uploads", "employees", String.valueOf(employeeId), kind, storedName)
                    .toString()
                    .replace("\\", "/");
        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload employee document", ex);
        }
    }

    public ResponseEntity<Resource> getFile(Long employeeId, String fileKey) {
        Employee employee = employeeRepository.findById(employeeId)
                .filter(e -> !Boolean.TRUE.equals(e.getDeleted()))
                .orElseThrow(() -> new EntityNotFoundException("Employee not found: " + employeeId));

        FileRef ref = resolveFileRef(employee, fileKey);
        Path resolvedPath = resolveStoredFilePath(ref.path(), ref.fileName());
        Resource resource = new FileSystemResource(resolvedPath.toFile());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        String filename = StringUtils.hasText(ref.fileName())
                ? ref.fileName().replace("\"", "")
                : resolvedPath.getFileName().toString().replace("\"", "");
        MediaType mediaType = MediaTypeFactory.getMediaType(filename)
                .or(() -> MediaTypeFactory.getMediaType(resolvedPath.getFileName().toString()))
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    private FileRef resolveFileRef(Employee employee, String fileKey) {
        String key = String.valueOf(fileKey == null ? "" : fileKey).trim().toLowerCase();
        return switch (key) {
            case "candidate-photo" -> new FileRef(employee.getCandidatePhotoPath(), deriveFileName(employee.getCandidatePhotoPath()));
            case "aadhar-card" -> new FileRef(employee.getAadharCardPath(), deriveFileName(employee.getAadharCardPath()));
            case "pan-card" -> new FileRef(employee.getPanCardPath(), deriveFileName(employee.getPanCardPath()));
            case "bank-passbook" -> new FileRef(employee.getBankPassbookPath(), deriveFileName(employee.getBankPassbookPath()));
            case "experience-certificate" -> new FileRef(employee.getExperienceCertificatePath(), deriveFileName(employee.getExperienceCertificatePath()));
            case "certificate" -> new FileRef(employee.getCertificatePath(), deriveFileName(employee.getCertificatePath()));
            case "graduation-certificate" -> new FileRef(employee.getGraduationCertificatePath(), deriveFileName(employee.getGraduationCertificatePath()));
            case "graduation-marksheet" -> new FileRef(employee.getGraduationMarksheetPath(), deriveFileName(employee.getGraduationMarksheetPath()));
            case "hsc-marksheet" -> new FileRef(employee.getHscMarksheetPath(), deriveFileName(employee.getHscMarksheetPath()));
            case "sslc-marksheet" -> new FileRef(employee.getSslcMarksheetPath(), deriveFileName(employee.getSslcMarksheetPath()));
            case "community-certificate" -> new FileRef(employee.getCommunityCertificatePath(), deriveFileName(employee.getCommunityCertificatePath()));
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown file key");
        };
    }

    private String deriveFileName(String path) {
        if (!StringUtils.hasText(path)) {
            return "";
        }
        String normalized = path.replace('\\', '/').trim();
        int slash = normalized.lastIndexOf('/');
        return slash >= 0 && slash < normalized.length() - 1
                ? normalized.substring(slash + 1)
                : normalized;
    }

    private Path resolveStoredFilePath(String storedPath, String storedFileName) {
        if (!StringUtils.hasText(storedPath) && !StringUtils.hasText(storedFileName)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        if (StringUtils.hasText(storedPath)) {
            String raw = storedPath.replace('\\', '/').trim();
            String normalized = raw;
            if (normalized.contains("/uploads/")) {
                normalized = normalized.substring(normalized.indexOf("/uploads/") + "/uploads/".length());
            }
            normalized = normalized.replaceFirst("^uploads/", "").replaceFirst("^/+", "");

            Optional<Path> direct = tryResolveExistingPath(raw);
            if (direct.isPresent()) {
                return direct.get();
            }

            Optional<Path> uploadsRelative = tryResolveExistingPath(Paths.get("uploads", normalized).toString());
            if (uploadsRelative.isPresent()) {
                return uploadsRelative.get();
            }

            int slash = normalized.lastIndexOf('/');
            if (slash >= 0 && slash < normalized.length() - 1) {
                Optional<Path> byFileNameOnly = tryResolveExistingPath(
                        Paths.get("uploads", normalized.substring(slash + 1)).toString()
                );
                if (byFileNameOnly.isPresent()) {
                    return byFileNameOnly.get();
                }
            }
        }

        if (StringUtils.hasText(storedFileName)) {
            Optional<Path> byName = tryResolveExistingPath(Paths.get("uploads", storedFileName).toString());
            if (byName.isPresent()) {
                return byName.get();
            }
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
    }

    private Optional<Path> tryResolveExistingPath(String rawPath) {
        if (!StringUtils.hasText(rawPath)) {
            return Optional.empty();
        }
        try {
            Path path = Paths.get(rawPath).normalize();
            if (path.toFile().exists()) {
                return Optional.of(path);
            }
            return Optional.empty();
        } catch (InvalidPathException ignored) {
            return Optional.empty();
        }
    }

    private record FileRef(String path, String fileName) {}

    private String normalizeStatus(String status) {
        String s = String.valueOf(status == null ? "ACTIVE" : status).trim().toUpperCase();
        return s.equals("INACTIVE") ? "INACTIVE" : "ACTIVE";
    }

    private EmployeeResponse toResponse(Employee e) {
        return toResponse(e, null);
    }

    private EmployeeResponse toResponse(Employee e, LocalDateTime offerLetterLinkExpiresAt) {
        EmployeeResponse r = new EmployeeResponse();
        r.setId(e.getId());
        r.setEmployeeCode(e.getEmployeeCode());
        r.setName(e.getName());
        r.setEmail(resolveEmployeeEmail(e));
        r.setCountryCode(e.getCountryCode());
        r.setPhone(e.getPhone());
        r.setDept(e.getDept());
        r.setInstitution(e.getInstitution());
        r.setDepartmentName(e.getDepartmentName());
        r.setTeam(e.getTeam());
        r.setDesignation(e.getDesignation());
        r.setHeadOfficeId(e.getHeadOfficeId());
        r.setBranchId(e.getBranchId());
        r.setDepartmentMasterId(e.getDepartmentMasterId());
        r.setDesignationMasterId(e.getDesignationMasterId());
        r.setEmployeeIdNumber(e.getEmployeeIdNumber());
        r.setFatherName(e.getFatherName());
        r.setMotherName(e.getMotherName());
        r.setPersonalContactNumber(e.getPersonalContactNumber());
        r.setAlternateContactNumber(e.getAlternateContactNumber());
        r.setLocation(e.getLocation());
        r.setPinCode(e.getPinCode());
        r.setState(e.getState());
        r.setCurrentAddress(e.getCurrentAddress());
        r.setPermanentAddress(e.getPermanentAddress());
        r.setPersonalEmail(e.getPersonalEmail());
        r.setOfficialEmail(e.getOfficialEmail());
        r.setDateOfBirth(e.getDateOfBirth());
        r.setMaritalStatus(e.getMaritalStatus());
        r.setSpouseName(e.getSpouseName());
        r.setBloodGroup(e.getBloodGroup());
        r.setPanCardNo(e.getPanCardNo());
        r.setAadharCardNo(e.getAadharCardNo());
        r.setBankAccountHolderName(e.getBankAccountHolderName());
        r.setBankAccountNumber(e.getBankAccountNumber());
        r.setIfscCode(e.getIfscCode());
        r.setBankAndBranch(e.getBankAndBranch());
        r.setEmploymentDetails1(e.getEmploymentDetails1());
        r.setEmploymentDetails2(e.getEmploymentDetails2());
        r.setPreviousEmploymentJoiningDate(e.getPreviousEmploymentJoiningDate());
        r.setPreviousEmploymentRelievingDate(e.getPreviousEmploymentRelievingDate());
        r.setPreviousEmploymentSalaryAtJoining(e.getPreviousEmploymentSalaryAtJoining());
        r.setPreviousEmploymentSalaryAtRelieving(e.getPreviousEmploymentSalaryAtRelieving());
        r.setPreviousEmploymentRelievedWithNoticePeriod(e.getPreviousEmploymentRelievedWithNoticePeriod());
        r.setPreviousEmploymentAbsconded(e.getPreviousEmploymentAbsconded());
        r.setPreviousEmploymentDesignationAtJoining(e.getPreviousEmploymentDesignationAtJoining());
        r.setPreviousEmploymentDesignationAtRelieving(e.getPreviousEmploymentDesignationAtRelieving());
        r.setPreviousEmploymentManagerName(e.getPreviousEmploymentManagerName());
        r.setPreviousEmploymentManagerMobileNumber(e.getPreviousEmploymentManagerMobileNumber());
        r.setPreviousEmploymentCompanyAddress(e.getPreviousEmploymentCompanyAddress());
        r.setGraduationDetails(e.getGraduationDetails());
        r.setHscMarkAndYear(e.getHscMarkAndYear());
        r.setSslcMarkAndYear(e.getSslcMarkAndYear());
        r.setEducationQualification(e.getEducationQualification());
        r.setEducationCourseName(e.getEducationCourseName());
        r.setEducationCertificateNumber(e.getEducationCertificateNumber());
        r.setEducationRollNumber(e.getEducationRollNumber());
        r.setEducationMark(e.getEducationMark());
        r.setEducationMaxMark(e.getEducationMaxMark());
        r.setEducationMarkPercentage(calculateEducationPercentage(e.getEducationMark(), e.getEducationMaxMark(), e.getEducationMarkPercentage()));
        r.setEducationFromYear(e.getEducationFromYear());
        r.setEducationToYear(e.getEducationToYear());
        r.setEmergencyContactName1(e.getEmergencyContactName1());
        r.setEmergencyContactRelation1(e.getEmergencyContactRelation1());
        r.setEmergencyContactPhone1(e.getEmergencyContactPhone1());
        r.setEmergencyContactName2(e.getEmergencyContactName2());
        r.setEmergencyContactRelation2(e.getEmergencyContactRelation2());
        r.setEmergencyContactPhone2(e.getEmergencyContactPhone2());
        r.setFriendRefName1(e.getFriendRefName1());
        r.setFriendRefContact1(e.getFriendRefContact1());
        r.setFriendRefName2(e.getFriendRefName2());
        r.setFriendRefContact2(e.getFriendRefContact2());
        r.setBranchToJoin(e.getBranchToJoin());
        r.setPlatformSource(e.getPlatformSource());
        r.setPfUan(e.getPfUan());
        r.setEsiNo(e.getEsiNo());
        r.setDeclarationDate(e.getDeclarationDate());
        r.setDeclarationPlace(e.getDeclarationPlace());
        r.setCandidatePhotoPath(e.getCandidatePhotoPath());
        r.setAadharCardPath(e.getAadharCardPath());
        r.setPanCardPath(e.getPanCardPath());
        r.setBankPassbookPath(e.getBankPassbookPath());
        r.setExperienceCertificatePath(e.getExperienceCertificatePath());
        r.setCertificatePath(e.getCertificatePath());
        r.setGraduationCertificatePath(e.getGraduationCertificatePath());
        r.setGraduationMarksheetPath(e.getGraduationMarksheetPath());
        r.setHscMarksheetPath(e.getHscMarksheetPath());
        r.setSslcMarksheetPath(e.getSslcMarksheetPath());
        r.setCommunityCertificatePath(e.getCommunityCertificatePath());
        r.setJoinDate(e.getJoinDate());
        r.setStatus(e.getStatus());
        r.setProfileStatus(e.getProfileStatus());
        r.setGender(e.getGender());
        r.setImg(e.getImg());
        r.setOfferLetterSent(offerLetterLinkExpiresAt != null);
        r.setOfferLetterLinkExpiresAt(offerLetterLinkExpiresAt);
        r.setLeavePolicyIds(getEmployeeLeavePolicyIds(e.getId()));

        r.setBasic(e.getBasic());
        r.setDa(e.getDa());
        r.setHra(e.getHra());
        r.setConveyance(e.getConveyance());
        r.setTds(e.getTds());
        r.setEsi(e.getEsi());
        r.setPf(e.getPf());
        r.setLeaveDeduction(e.getLeaveDeduction());
        r.setNetSalary(e.getNetSalary());

        return r;
    }

    private void syncEmployeeSalary(Employee e) {
        com.nexorcrm.backend.entity.EmployeeSalary es = employeeSalaryRepository
                .findByEmployeeIdAndDeletedFalse(e.getId())
                .orElse(new com.nexorcrm.backend.entity.EmployeeSalary());
        
        es.setEmployee(e);
        es.setBasic(e.getBasic() != null ? e.getBasic() : BigDecimal.ZERO);
        es.setDa(e.getDa() != null ? e.getDa() : BigDecimal.ZERO);
        es.setHra(e.getHra() != null ? e.getHra() : BigDecimal.ZERO);
        es.setConveyance(e.getConveyance() != null ? e.getConveyance() : BigDecimal.ZERO);
        es.setTds(e.getTds() != null ? e.getTds() : BigDecimal.ZERO);
        es.setEsi(e.getEsi() != null ? e.getEsi() : BigDecimal.ZERO);
        es.setPf(e.getPf() != null ? e.getPf() : BigDecimal.ZERO);
        es.setLeaveDeduction(e.getLeaveDeduction() != null ? e.getLeaveDeduction() : BigDecimal.ZERO);
        es.setNetSalary(e.getNetSalary() != null ? e.getNetSalary() : BigDecimal.ZERO);
        es.setStatus("Active");
        es.setDeleted(false);
        employeeSalaryRepository.save(es);

        // Auto-sync to ProvidentFund entity
        if (e.getPf() != null) {
            ProvidentFund pf = providentFundRepository
                    .findByEmployeeIdAndDeletedFalse(e.getId())
                    .orElse(null);
            if (pf == null) {
                pf = new ProvidentFund();
                pf.setEmployee(e);
                pf.setPfType("Employee Provident Fund");
                pf.setEmployeeShareAmount(e.getPf());
                pf.setOrganizationShareAmount(BigDecimal.ZERO);
                pf.setStatus("Approved");
                pf.setDescription("Automatically created from Employee Salary details");
                providentFundRepository.save(pf);
            } else {
                pf.setEmployeeShareAmount(e.getPf());
                providentFundRepository.save(pf);
            }
        }
    }

    private String firstNonBlank(String first, String second) {
        String firstValue = trimToNull(first);
        return firstValue != null ? firstValue : trimToNull(second);
    }

    private String calculateEducationPercentage(String mark, String maxMark, String fallbackPercentage) {
        String markValue = trimToNull(mark);
        String maxMarkValue = trimToNull(maxMark);
        if (markValue == null || maxMarkValue == null) {
            return trimToNull(fallbackPercentage);
        }
        try {
            double markNumber = Double.parseDouble(markValue);
            double maxNumber = Double.parseDouble(maxMarkValue);
            if (maxNumber <= 0d) {
                return trimToNull(fallbackPercentage);
            }
            return String.format(java.util.Locale.ROOT, "%.2f", (markNumber / maxNumber) * 100d);
        } catch (NumberFormatException ex) {
            return trimToNull(fallbackPercentage);
        }
    }

    private void setIfPresent(String value, Consumer<String> setter) {
        if (value != null) {
            setter.accept(trimToNull(value));
        }
    }

    private void setIfPresent(LocalDate value, Consumer<LocalDate> setter) {
        if (value != null) {
            setter.accept(value);
        }
    }

    private String resolveEmployeeEmail(Employee employee) {
        if (employee == null) {
            return null;
        }
        String resolvedEmail = firstNonBlank(employee.getEmail(), employee.getOfficialEmail());
        resolvedEmail = firstNonBlank(resolvedEmail, employee.getPersonalEmail());
        return resolvedEmail == null ? null : resolvedEmail.toLowerCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean matchesScope(String value, String scope) {
        if (scope == null) {
            return true;
        }
        return trimToNull(value) != null && trimToNull(value).equalsIgnoreCase(scope);
    }

    private boolean matchesId(Long actual, Long expected) {
        if (expected == null) {
            return true;
        }
        return actual != null && actual.equals(expected);
    }

    private boolean matchesHeadOfficeId(Long actual, Long expected) {
        if (expected == null) {
            return true;
        }
        if (actual == null) {
            return true;
        }
        return actual.equals(expected);
    }
}
