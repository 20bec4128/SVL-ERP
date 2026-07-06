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
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class BranchWorkflowConfigService {

    private static final Logger logger = LoggerFactory.getLogger(BranchWorkflowConfigService.class);

    private final BranchWorkflowConfigRepository repository;
    private final BranchMasterRepository branchRepository;
    private final UserDesignationRepository designationRepository;
    private final UserRepository userRepository;

    public BranchWorkflowConfigService(
            BranchWorkflowConfigRepository repository,
            BranchMasterRepository branchRepository,
            UserDesignationRepository designationRepository,
            UserRepository userRepository) {
        this.repository = repository;
        this.branchRepository = branchRepository;
        this.designationRepository = designationRepository;
        this.userRepository = userRepository;
    }

    public BranchWorkflowConfigResponse getByBranchId(Long branchId) {
        BranchMaster branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));

        Optional<BranchWorkflowConfig> configOpt = repository.findByBranchId(branchId);
        if (configOpt.isPresent()) {
            return toResponse(configOpt.get());
        }

        // Return empty response with branch details
        BranchWorkflowConfigResponse response = new BranchWorkflowConfigResponse();
        response.setBranchId(branch.getId());
        response.setBranchName(branch.getName());
        return response;
    }

    public BranchWorkflowConfigResponse saveConfig(BranchWorkflowConfigRequest request) {
        Long branchId = request.getBranchId();
        BranchMaster branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));

        // 1. Validation: Designation IDs must be distinct if provided
        validateDistinctDesignations(
                request.getLeadDesignationId(),
                request.getDesignDesignationId(),
                request.getProductionDesignationId()
        );

        // 2. Load Designations & Resolve Team Leads
        UserDesignation leadDesig = null;
        User leadUser = null;
        if (request.getLeadDesignationId() != null) {
            leadDesig = designationRepository.findById(request.getLeadDesignationId())
                    .orElseThrow(() -> new EntityNotFoundException("Lead Team Designation not found"));
            leadUser = resolveTeamLeadOrThrow(branch, leadDesig, "Lead Team");
        }

        UserDesignation designDesig = null;
        User designUser = null;
        if (request.getDesignDesignationId() != null) {
            designDesig = designationRepository.findById(request.getDesignDesignationId())
                    .orElseThrow(() -> new EntityNotFoundException("Design Team Designation not found"));
            designUser = resolveTeamLeadOrThrow(branch, designDesig, "Design Team");
        }

        UserDesignation prodDesig = null;
        User prodUser = null;
        if (request.getProductionDesignationId() != null) {
            prodDesig = designationRepository.findById(request.getProductionDesignationId())
                    .orElseThrow(() -> new EntityNotFoundException("Production Team Designation not found"));
            prodUser = resolveTeamLeadOrThrow(branch, prodDesig, "Production Team");
        }

        // 3. Save or Update
        BranchWorkflowConfig config = repository.findByBranchId(branchId)
                .orElse(new BranchWorkflowConfig());

        config.setBranch(branch);
        config.setLeadDesignation(leadDesig);
        config.setLeadTeamLeadUser(leadUser);
        config.setDesignDesignation(designDesig);
        config.setDesignTeamLeadUser(designUser);
        config.setProductionDesignation(prodDesig);
        config.setProductionTeamLeadUser(prodUser);

        config = repository.save(config);
        return toResponse(config);
    }

    public BranchWorkflowPreviewResponse previewConfig(BranchWorkflowPreviewRequest request) {
        BranchWorkflowPreviewResponse response = new BranchWorkflowPreviewResponse();
        response.setValid(true);

        if (request.getBranchId() == null) {
            response.setValid(false);
            response.setGeneralMessage("Branch ID is required for preview");
            return response;
        }

        Optional<BranchMaster> branchOpt = branchRepository.findById(request.getBranchId());
        if (branchOpt.isEmpty()) {
            response.setValid(false);
            response.setGeneralMessage("Branch not found");
            return response;
        }
        BranchMaster branch = branchOpt.get();

        // Validate distinct designations check in preview
        try {
            validateDistinctDesignations(
                    request.getLeadDesignationId(),
                    request.getDesignDesignationId(),
                    request.getProductionDesignationId()
            );
        } catch (IllegalArgumentException e) {
            response.setValid(false);
            response.setGeneralMessage(e.getMessage());
        }

        response.setLeadTeamLead(previewCategory(branch, request.getLeadDesignationId()));
        response.setDesignTeamLead(previewCategory(branch, request.getDesignDesignationId()));
        response.setProductionTeamLead(previewCategory(branch, request.getProductionDesignationId()));

        // Aggregate validity: if any previewed category has NOT_FOUND status, the whole config is invalid
        if (response.isValid()) {
            boolean anyError = isError(response.getLeadTeamLead())
                    || isError(response.getDesignTeamLead())
                    || isError(response.getProductionTeamLead());
            if (anyError) {
                response.setValid(false);
                response.setGeneralMessage("One or more designations have no active team lead.");
            } else {
                response.setGeneralMessage("Configuration is valid.");
            }
        }

        return response;
    }

    private void validateDistinctDesignations(Long leadId, Long designId, Long prodId) {
        Set<Long> ids = new HashSet<>();
        if (leadId != null) ids.add(leadId);
        if (designId != null) {
            if (!ids.add(designId)) {
                throw new IllegalArgumentException("Designations configured for Lead, Design, and Production teams must be distinct");
            }
        }
        if (prodId != null) {
            if (!ids.add(prodId)) {
                throw new IllegalArgumentException("Designations configured for Lead, Design, and Production teams must be distinct");
            }
        }
    }

    private User resolveTeamLeadOrThrow(BranchMaster branch, UserDesignation designation, String teamType) {
        List<User> leads = userRepository.findActiveTeamLeadsByBranchAndTeam(branch.getName(), designation.getName());
        if (leads.isEmpty()) {
            throw new IllegalArgumentException("No active team lead found for designation \"" 
                    + designation.getName() + "\" in branch \"" + branch.getName() + "\" for " + teamType);
        }
        if (leads.size() > 1) {
            logger.warn("Multiple team leads found for designation {} in branch {} for team {}. Auto-selecting user ID {}.",
                    designation.getName(), branch.getName(), teamType, leads.get(0).getId());
        }
        return leads.get(0);
    }

    private BranchWorkflowPreviewResponse.TeamLeadPreview previewCategory(BranchMaster branch, Long designationId) {
        BranchWorkflowPreviewResponse.TeamLeadPreview preview = new BranchWorkflowPreviewResponse.TeamLeadPreview();
        if (designationId == null) {
            preview.setStatus("RESOLVED");
            preview.setMessage("Not configured (will clear)");
            return preview;
        }

        Optional<UserDesignation> desigOpt = designationRepository.findById(designationId);
        if (desigOpt.isEmpty()) {
            preview.setStatus("NOT_FOUND");
            preview.setMessage("Designation not found");
            return preview;
        }
        UserDesignation designation = desigOpt.get();
        preview.setDesignationName(designation.getName());

        List<User> leads = userRepository.findActiveTeamLeadsByBranchAndTeam(branch.getName(), designation.getName());
        if (leads.isEmpty()) {
            preview.setStatus("NOT_FOUND");
            preview.setMessage("No active team lead found for designation \"" + designation.getName() + "\" in this branch");
        } else if (leads.size() > 1) {
            User selected = leads.get(0);
            preview.setUserId(selected.getId());
            preview.setUserName(selected.getUsername());
            preview.setFullName(selected.getFirstName() + " " + selected.getLastName());
            preview.setStatus("MULTIPLE");
            preview.setMessage("Multiple team leads found. \"" + preview.getFullName() + "\" will be auto-selected.");
        } else {
            User selected = leads.get(0);
            preview.setUserId(selected.getId());
            preview.setUserName(selected.getUsername());
            preview.setFullName(selected.getFirstName() + " " + selected.getLastName());
            preview.setStatus("RESOLVED");
            preview.setMessage("Resolved: \"" + preview.getFullName() + "\"");
        }

        return preview;
    }

    private boolean isError(BranchWorkflowPreviewResponse.TeamLeadPreview preview) {
        return preview != null && "NOT_FOUND".equals(preview.getStatus());
    }

    private BranchWorkflowConfigResponse toResponse(BranchWorkflowConfig config) {
        BranchWorkflowConfigResponse r = new BranchWorkflowConfigResponse();
        r.setId(config.getId());
        r.setBranchId(config.getBranch().getId());
        r.setBranchName(config.getBranch().getName());

        if (config.getLeadDesignation() != null) {
            r.setLeadDesignationId(config.getLeadDesignation().getId());
            r.setLeadDesignationName(config.getLeadDesignation().getName());
        }
        if (config.getLeadTeamLeadUser() != null) {
            r.setLeadTeamLeadUserId(config.getLeadTeamLeadUser().getId());
            r.setLeadTeamLeadUserName(config.getLeadTeamLeadUser().getFirstName() + " " + config.getLeadTeamLeadUser().getLastName());
        }

        if (config.getDesignDesignation() != null) {
            r.setDesignDesignationId(config.getDesignDesignation().getId());
            r.setDesignDesignationName(config.getDesignDesignation().getName());
        }
        if (config.getDesignTeamLeadUser() != null) {
            r.setDesignTeamLeadUserId(config.getDesignTeamLeadUser().getId());
            r.setDesignTeamLeadUserName(config.getDesignTeamLeadUser().getFirstName() + " " + config.getDesignTeamLeadUser().getLastName());
        }

        if (config.getProductionDesignation() != null) {
            r.setProductionDesignationId(config.getProductionDesignation().getId());
            r.setProductionDesignationName(config.getProductionDesignation().getName());
        }
        if (config.getProductionTeamLeadUser() != null) {
            r.setProductionTeamLeadUserId(config.getProductionTeamLeadUser().getId());
            r.setProductionTeamLeadUserName(config.getProductionTeamLeadUser().getFirstName() + " " + config.getProductionTeamLeadUser().getLastName());
        }

        r.setCreatedAt(config.getCreatedAt());
        r.setUpdatedAt(config.getUpdatedAt());
        return r;
    }
}
