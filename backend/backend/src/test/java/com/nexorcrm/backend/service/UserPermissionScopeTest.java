package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.CreateUserRequest;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.AuditLogRepository;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import com.nexorcrm.backend.repo.DesignationMasterRepository;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.RefreshTokenRepository;
import com.nexorcrm.backend.repo.UserGroupMemberRepository;
import com.nexorcrm.backend.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserPermissionScopeTest {

    @Mock private UserRepository userRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private BranchMasterRepository branchMasterRepository;
    @Mock private DepartmentMasterRepository departmentMasterRepository;
    @Mock private DesignationMasterRepository designationMasterRepository;
    @Mock private UserGroupMemberRepository userGroupMemberRepository;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private SecuritySettingsService securitySettingsService;
    @Mock private AuditService auditService;

    @InjectMocks private SuperAdminService superAdminService;

    @Captor private ArgumentCaptor<User> userCaptor;

    @BeforeEach
    void setUpCommonStubs() {
        when(securitySettingsService.isUsernameDisallowed(any())).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCaseAndIsDeletedFalse(any())).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCaseAndIsDeletedFalse(any())).thenReturn(false);
        when(userRepository.findByUsernameAndIsDeletedFalse("superadmin"))
                .thenReturn(Optional.of(buildActor()));
    }

    @Test
    void shouldPersistRequestLabelsIndependentOfEmployeeHRM() {
        Employee employee = new Employee();
        employee.setId(101L);
        employee.setEmail("employee@example.com");
        employee.setInstitution("Acme Branch");
        employee.setDepartmentName("HRM Core Engineering");
        employee.setTeam("Java Developer");

        CreateUserRequest request = validRequest("emp-scope-1", "employee@example.com");
        request.setRole("EMPLOYEE");
        request.setDepartmentName("User Operations");
        request.setTeam("User Sales Executive");

        when(employeeRepository.findById(101L)).thenReturn(Optional.of(employee));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        superAdminService.createPendingUser(request, "superadmin");

        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();

        assertThat(saved.getDepartmentName()).isEqualTo("User Operations");
        assertThat(saved.getTeamName()).isEqualTo("User Sales Executive");
        assertThat(saved.getDepartmentName()).isNotEqualTo(employee.getDepartmentName());
        assertThat(saved.getTeamName()).isNotEqualTo(employee.getTeam());
    }

    @Test
    void shouldAllowWidenedStringLabels() {
        Employee employee = new Employee();
        employee.setId(202L);
        employee.setEmail("employee2@example.com");
        employee.setInstitution("Acme Branch");

        String longDepartmentName = "D".repeat(240);

        CreateUserRequest request = validRequest("emp-scope-2", "employee2@example.com");
        request.setRole("EMPLOYEE");
        request.setDepartmentName(longDepartmentName);
        request.setTeam("User Sales Executive");

        when(employeeRepository.findById(202L)).thenReturn(Optional.of(employee));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        superAdminService.createPendingUser(request, "superadmin");

        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();

        assertThat(saved.getDepartmentName()).hasSize(240);
        assertThat(saved.getDepartmentName()).isEqualTo(longDepartmentName);
        assertThat(saved.getTeamName()).isEqualTo("User Sales Executive");
        verify(userRepository, never()).save(null);
    }

    private CreateUserRequest validRequest(String username, String email) {
        CreateUserRequest request = new CreateUserRequest();
        request.setEmployeeId(username.endsWith("1") ? 101L : 202L);
        request.setUsername(username);
        request.setEmail(email);
        request.setFirstName("Test");
        request.setLastName("User");
        request.setPassword("StrongP@ss1");
        request.setConfirmPassword("StrongP@ss1");
        request.setInstitution(null);
        return request;
    }

    private User buildActor() {
        User actor = new User();
        actor.setId(1L);
        actor.setUsername("superadmin");
        actor.setEmail("superadmin@example.com");
        actor.setRole(Role.SUPER_ADMIN);
        actor.setActivationStatus(ActivationStatus.ACTIVE);
        actor.setActive(true);
        return actor;
    }
}
