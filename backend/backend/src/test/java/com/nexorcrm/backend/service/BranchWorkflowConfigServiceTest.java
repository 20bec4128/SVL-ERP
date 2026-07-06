package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.*;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.entity.BranchWorkflowConfig;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.UserDesignation;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.BranchWorkflowConfigRepository;
import com.nexorcrm.backend.repo.UserDesignationRepository;
import com.nexorcrm.backend.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BranchWorkflowConfigServiceTest {

    @Mock private BranchWorkflowConfigRepository repository;
    @Mock private BranchMasterRepository branchRepository;
    @Mock private UserDesignationRepository designationRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private BranchWorkflowConfigService service;

    private BranchMaster branch;
    private UserDesignation leadDesig;
    private UserDesignation designDesig;
    private UserDesignation prodDesig;
    private User teamLeadUser;

    @BeforeEach
    void setUp() {
        branch = new BranchMaster();
        branch.setId(10L);
        branch.setName("Chennai Branch");

        leadDesig = new UserDesignation();
        leadDesig.setId(101L);
        leadDesig.setName("Lead Team Designation");

        designDesig = new UserDesignation();
        designDesig.setId(102L);
        designDesig.setName("Design Team Designation");

        prodDesig = new UserDesignation();
        prodDesig.setId(103L);
        prodDesig.setName("Production Team Designation");

        teamLeadUser = new User();
        teamLeadUser.setId(201L);
        teamLeadUser.setFirstName("Rambo");
        teamLeadUser.setLastName("Silvester");
        teamLeadUser.setUsername("ramboTL");
    }

    @Test
    void shouldSaveConfigWhenValid() {
        BranchWorkflowConfigRequest request = new BranchWorkflowConfigRequest();
        request.setBranchId(10L);
        request.setLeadDesignationId(101L);
        request.setDesignDesignationId(102L);
        request.setProductionDesignationId(103L);

        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(designationRepository.findById(101L)).thenReturn(Optional.of(leadDesig));
        when(designationRepository.findById(102L)).thenReturn(Optional.of(designDesig));
        when(designationRepository.findById(103L)).thenReturn(Optional.of(prodDesig));

        when(userRepository.findActiveTeamLeadsByBranchAndTeam("Chennai Branch", "Lead Team Designation"))
                .thenReturn(List.of(teamLeadUser));
        when(userRepository.findActiveTeamLeadsByBranchAndTeam("Chennai Branch", "Design Team Designation"))
                .thenReturn(List.of(teamLeadUser));
        when(userRepository.findActiveTeamLeadsByBranchAndTeam("Chennai Branch", "Production Team Designation"))
                .thenReturn(List.of(teamLeadUser));

        when(repository.findByBranchId(10L)).thenReturn(Optional.empty());
        when(repository.save(any(BranchWorkflowConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        BranchWorkflowConfigResponse response = service.saveConfig(request);

        assertThat(response).isNotNull();
        assertThat(response.getBranchId()).isEqualTo(10L);
        assertThat(response.getLeadTeamLeadUserId()).isEqualTo(201L);
        assertThat(response.getDesignTeamLeadUserId()).isEqualTo(201L);
        assertThat(response.getProductionTeamLeadUserId()).isEqualTo(201L);

        verify(repository).save(any(BranchWorkflowConfig.class));
    }

    @Test
    void shouldThrowExceptionWhenDuplicateDesignationsSelected() {
        BranchWorkflowConfigRequest request = new BranchWorkflowConfigRequest();
        request.setBranchId(10L);
        request.setLeadDesignationId(101L);
        request.setDesignDesignationId(101L); // duplicate
        request.setProductionDesignationId(103L);

        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));

        assertThatThrownBy(() -> service.saveConfig(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must be distinct");

        verify(repository, never()).save(any(BranchWorkflowConfig.class));
    }

    @Test
    void shouldThrowExceptionWhenNoTeamLeadFound() {
        BranchWorkflowConfigRequest request = new BranchWorkflowConfigRequest();
        request.setBranchId(10L);
        request.setLeadDesignationId(101L);

        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(designationRepository.findById(101L)).thenReturn(Optional.of(leadDesig));
        when(userRepository.findActiveTeamLeadsByBranchAndTeam("Chennai Branch", "Lead Team Designation"))
                .thenReturn(Collections.emptyList()); // zero active team leads

        assertThatThrownBy(() -> service.saveConfig(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No active team lead found");

        verify(repository, never()).save(any(BranchWorkflowConfig.class));
    }

    @Test
    void shouldPreviewCorrectlyWithStatusFlags() {
        BranchWorkflowPreviewRequest request = new BranchWorkflowPreviewRequest();
        request.setBranchId(10L);
        request.setLeadDesignationId(101L); // Valid designation with 1 TL
        request.setDesignDesignationId(102L); // Valid designation with multiple TLs
        request.setProductionDesignationId(103L); // Designation with 0 TLs

        User secondTL = new User();
        secondTL.setId(202L);
        secondTL.setFirstName("Second");
        secondTL.setLastName("Lead");
        secondTL.setUsername("secondTL");

        when(branchRepository.findById(10L)).thenReturn(Optional.of(branch));
        when(designationRepository.findById(101L)).thenReturn(Optional.of(leadDesig));
        when(designationRepository.findById(102L)).thenReturn(Optional.of(designDesig));
        when(designationRepository.findById(103L)).thenReturn(Optional.of(prodDesig));

        when(userRepository.findActiveTeamLeadsByBranchAndTeam("Chennai Branch", "Lead Team Designation"))
                .thenReturn(List.of(teamLeadUser));
        when(userRepository.findActiveTeamLeadsByBranchAndTeam("Chennai Branch", "Design Team Designation"))
                .thenReturn(List.of(teamLeadUser, secondTL));
        when(userRepository.findActiveTeamLeadsByBranchAndTeam("Chennai Branch", "Production Team Designation"))
                .thenReturn(Collections.emptyList());

        BranchWorkflowPreviewResponse response = service.previewConfig(request);

        assertThat(response).isNotNull();
        assertThat(response.isValid()).isFalse(); // False because production designation has no active TLs

        assertThat(response.getLeadTeamLead().getStatus()).isEqualTo("RESOLVED");
        assertThat(response.getLeadTeamLead().getUserId()).isEqualTo(201L);

        assertThat(response.getDesignTeamLead().getStatus()).isEqualTo("MULTIPLE");
        assertThat(response.getDesignTeamLead().getUserId()).isEqualTo(201L);

        assertThat(response.getProductionTeamLead().getStatus()).isEqualTo("NOT_FOUND");
        assertThat(response.getProductionTeamLead().getUserId()).isNull();
    }
}
