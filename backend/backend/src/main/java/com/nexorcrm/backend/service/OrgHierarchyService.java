package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.CreateDepartmentRequest;
import com.nexorcrm.backend.dto.CreateInstitutionRequest;
import com.nexorcrm.backend.dto.CreateTeamRequest;
import com.nexorcrm.backend.dto.OrgOptionResponse;
import com.nexorcrm.backend.dto.OrgSelectionResponse;
import com.nexorcrm.backend.entity.Department;
import com.nexorcrm.backend.entity.Institution;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.Team;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.DepartmentRepository;
import com.nexorcrm.backend.repo.InstitutionRepository;
import com.nexorcrm.backend.repo.TeamRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class OrgHierarchyService {

    private final InstitutionRepository institutionRepository;
    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public OrgHierarchyService(
            InstitutionRepository institutionRepository,
            DepartmentRepository departmentRepository,
            TeamRepository teamRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository
    ) {
        this.institutionRepository = institutionRepository;
        this.departmentRepository = departmentRepository;
        this.teamRepository = teamRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<OrgOptionResponse> listInstitutions() {
        return institutionRepository.findByIsDeletedFalseOrderByNameAsc().stream()
                .map(i -> new OrgOptionResponse(i.getId(), i.getName(), i.getStatus()))
                .toList();
    }

    public OrgOptionResponse addInstitution(CreateInstitutionRequest req, String actor) {
        assertCanManage(actor);
        String name = req.getName().trim();
        if (institutionRepository.existsByNameIgnoreCaseAndIsDeletedFalse(name)) {
            throw new IllegalStateException("Branch already exists");
        }
        Institution institution = new Institution();
        institution.setName(name);
        institution.setEmail(trimOrNull(req.getEmail()));
        institution.setPhone(trimOrNull(req.getPhone()));
        institution.setAddress(trimOrNull(req.getAddress()));
        institution.setStatus(status(req.getStatus()));
        Institution saved = institutionRepository.save(institution);
        return new OrgOptionResponse(saved.getId(), saved.getName(), saved.getStatus());
    }

    @Transactional(readOnly = true)
    public List<OrgOptionResponse> listDepartments(Long institutionId) {
        Institution institution = institutionRepository.findByIdAndIsDeletedFalse(institutionId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
        return departmentRepository.findByInstitutionAndIsDeletedFalseOrderByNameAsc(institution).stream()
                .map(d -> new OrgOptionResponse(d.getId(), d.getName(), d.getStatus()))
                .toList();
    }

    public OrgOptionResponse addDepartment(CreateDepartmentRequest req, String actor) {
        assertCanManage(actor);
        Institution institution = institutionRepository.findByIdAndIsDeletedFalse(req.getInstitutionId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
        String name = req.getName().trim();
        if (departmentRepository.existsByInstitutionAndNameIgnoreCaseAndIsDeletedFalse(institution, name)) {
            throw new IllegalStateException("Department already exists");
        }
        Department department = new Department();
        department.setInstitution(institution);
        department.setName(name);
        department.setStatus(status(req.getStatus()));
        Department saved = departmentRepository.save(department);
        return new OrgOptionResponse(saved.getId(), saved.getName(), saved.getStatus());
    }

    @Transactional(readOnly = true)
    public List<OrgOptionResponse> listTeams(Long institutionId, Long departmentId) {
        Institution institution = institutionRepository.findByIdAndIsDeletedFalse(institutionId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
        Department department = departmentRepository.findByIdAndIsDeletedFalse(departmentId)
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));
        if (!department.getInstitution().getId().equals(institution.getId())) {
            throw new EntityNotFoundException("Department not found in branch");
        }
        return teamRepository.findByDepartmentAndIsDeletedFalseOrderByNameAsc(department).stream()
                .map(t -> new OrgOptionResponse(t.getId(), t.getName(), t.getStatus()))
                .toList();
    }

    public OrgOptionResponse addTeam(CreateTeamRequest req, String actor) {
        assertCanManage(actor);
        Institution institution = institutionRepository.findByIdAndIsDeletedFalse(req.getInstitutionId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
        Department department = departmentRepository.findByIdAndIsDeletedFalse(req.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));
        if (!department.getInstitution().getId().equals(institution.getId())) {
            throw new EntityNotFoundException("Department not found in branch");
        }
        String name = req.getName().trim();
        if (teamRepository.existsByDepartmentAndNameIgnoreCaseAndIsDeletedFalse(department, name)) {
            throw new IllegalStateException("Team already exists");
        }
        Team team = new Team();
        team.setInstitution(institution);
        team.setDepartment(department);
        team.setName(name);
        team.setStatus(status(req.getStatus()));
        Team saved = teamRepository.save(team);
        return new OrgOptionResponse(saved.getId(), saved.getName(), saved.getStatus());
    }

    @Transactional(readOnly = true)
    public OrgSelectionResponse getUserOrgSelection(Long userId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (!canViewUser(actor, target)) {
            throw new AccessDeniedException("You do not have permission to view this user");
        }

        OrgSelectionResponse response = new OrgSelectionResponse();

        Employee employee = StringUtils.hasText(target.getEmail())
                ? employeeRepository.findFirstByEmailIgnoreCaseAndDeletedFalse(target.getEmail().trim())
                .orElse(null)
                : null;

        String institutionName = employee != null && StringUtils.hasText(employee.getInstitution())
                ? employee.getInstitution()
                : target.getInstitutionName();
        String departmentName = employee != null && StringUtils.hasText(employee.getDepartmentName())
                ? employee.getDepartmentName()
                : target.getDepartmentName();
        String teamName = employee != null && StringUtils.hasText(employee.getTeam())
                ? employee.getTeam()
                : target.getTeamName();

        response.setInstitutionName(institutionName);
        response.setCategoryName(null);
        response.setTypeName(null);
        response.setDepartmentName(departmentName);
        response.setTeamName(teamName);

        if (!StringUtils.hasText(institutionName)) {
            return response;
        }

        Institution institution = institutionRepository
                .findByNameIgnoreCaseAndIsDeletedFalse(institutionName.trim())
                .orElse(null);
        if (institution == null) {
            return response;
        }
        response.setInstitutionId(institution.getId());

        if (!StringUtils.hasText(departmentName)) {
            return response;
        }
        Department department = departmentRepository
                .findFirstByInstitutionAndNameIgnoreCaseAndIsDeletedFalseOrderByIdAsc(institution, departmentName.trim())
                .orElse(null);
        if (department == null) {
            return response;
        }
        response.setDepartmentId(department.getId());

        if (!StringUtils.hasText(teamName)) {
            return response;
        }
        Team team = teamRepository
                .findFirstByDepartmentAndNameIgnoreCaseAndIsDeletedFalseOrderByIdAsc(department, teamName.trim())
                .orElse(null);
        if (team == null) {
            return response;
        }
        response.setTeamId(team.getId());
        return response;
    }

    private void assertCanManage(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.SUPER_ADMIN && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You do not have permission to manage org hierarchy");
        }
    }

    private User resolveActor(String actorPrincipal) {
        if (!StringUtils.hasText(actorPrincipal)) {
            throw new AccessDeniedException("Unauthenticated actor");
        }
        if (actorPrincipal.contains("@")) {
            return userRepository.findByEmailAndIsDeletedFalse(actorPrincipal.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
        }
        return userRepository.findByUsernameAndIsDeletedFalse(actorPrincipal.trim())
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
    }

    private String status(String value) {
        String resolved = StringUtils.hasText(value) ? value.trim().toUpperCase(Locale.ROOT) : "ACTIVE";
        return "INACTIVE".equals(resolved) ? "INACTIVE" : "ACTIVE";
    }

    private String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private boolean canViewUser(User actor, User target) {
        if (actor == null || target == null) {
            return false;
        }
        if (actor.getId() != null && actor.getId().equals(target.getId())) {
            return true;
        }
        Role actorRole = actor.getRole();
        if (actorRole == Role.SUPER_ADMIN) {
            return true;
        }
        if (actorRole == Role.ADMIN) {
            String actorBranch = safeLower(actor.getInstitutionName());
            String targetBranch = safeLower(target.getInstitutionName());
            return !actorBranch.isEmpty() && actorBranch.equals(targetBranch);
        }
        if (actorRole == Role.MANAGER) {
            return !safeLower(actor.getInstitutionName()).isEmpty()
                    && safeLower(actor.getInstitutionName()).equals(safeLower(target.getInstitutionName()))
                    && !safeLower(actor.getDepartmentName()).isEmpty()
                    && safeLower(actor.getDepartmentName()).equals(safeLower(target.getDepartmentName()))
                    && (target.getRole() == Role.TEAM_LEAD || target.getRole() == Role.EMPLOYEE);
        }
        if (actorRole == Role.TEAM_LEAD) {
            return !safeLower(actor.getInstitutionName()).isEmpty()
                    && safeLower(actor.getInstitutionName()).equals(safeLower(target.getInstitutionName()))
                    && !safeLower(actor.getDepartmentName()).isEmpty()
                    && safeLower(actor.getDepartmentName()).equals(safeLower(target.getDepartmentName()))
                    && !safeLower(actor.getTeamName()).isEmpty()
                    && safeLower(actor.getTeamName()).equals(safeLower(target.getTeamName()))
                    && target.getRole() == Role.EMPLOYEE;
        }
        return false;
    }

    private String safeLower(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "";
    }
}
