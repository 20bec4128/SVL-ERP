package com.nexorcrm.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexorcrm.backend.dto.LeadFlowRequest;
import com.nexorcrm.backend.dto.LeadFlowResponse;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.entity.LeadFlowConfig;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.LeadStatus;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.LeadFlowConfigRepository;
import com.nexorcrm.backend.repo.LeadStatusRepository;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.repo.UserGroupRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class LeadFlowService {

    private static final Long FLOW_ID = 1L;
    private static final String GLOBAL_SCOPE_KEY = "__GLOBAL__";

    private final LeadFlowConfigRepository leadFlowConfigRepository;
    private final ObjectProvider<LeadService> leadServiceProvider;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final LeadStatusRepository leadStatusRepository;
    private final UserGroupRepository userGroupRepository;
    private final BranchMasterRepository branchMasterRepository;

    public LeadFlowService(LeadFlowConfigRepository leadFlowConfigRepository,
                           ObjectProvider<LeadService> leadServiceProvider,
                           ObjectMapper objectMapper,
                           UserRepository userRepository,
                           LeadStatusRepository leadStatusRepository,
                           UserGroupRepository userGroupRepository,
                           BranchMasterRepository branchMasterRepository) {
        this.leadFlowConfigRepository = leadFlowConfigRepository;
        this.leadServiceProvider = leadServiceProvider;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.leadStatusRepository = leadStatusRepository;
        this.userGroupRepository = userGroupRepository;
        this.branchMasterRepository = branchMasterRepository;
    }

    @Transactional(readOnly = true)
    public LeadFlowResponse getFlow() {
        return toResponse(loadConfig(), Scope.global());
    }

    @Transactional(readOnly = true)
    public LeadFlowResponse getFlow(String actorPrincipal, Long branchId, String institutionName) {
        User actor = resolveActor(actorPrincipal);
        Scope scope = resolveScope(actor, branchId, institutionName);
        return toResponse(loadConfig(), scope);
    }

    @Transactional(readOnly = true)
    public LeadFlowResponse getFlowForActor(User actor) {
        Scope scope = resolveScope(actor, null, null);
        return toResponse(loadConfig(), scope);
    }

    @Transactional(readOnly = true)
    public LeadFlowResponse getFlowForScope(String institutionName) {
        Scope scope = resolveScope(null, null, institutionName);
        return toResponse(loadConfig(), scope);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRulesForActor(User actor) {
        return getFlowForActor(actor).getRules();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFlowGroups() {
        return userGroupRepository.findAllByOrderByNameAsc().stream()
                .map(group -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", group.getId());
                    row.put("name", group.getName());
                    return row;
                })
                .toList();
    }

    @Transactional
    public LeadFlowResponse updateFlow(LeadFlowRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        Scope scope = resolveScope(actor, request.getBranchId(), request.getInstitutionName());
        LeadFlowConfig config = loadConfig();
        List<Map<String, Object>> sanitizedRules = sanitizeFlowRules(request.getRules(), request.getStatuses());
        if (scope.isGlobal()) {
            config.setDefaultGroupId(request.getDefaultGroupId());
            config.setRulesJson(serializeRules(sanitizedRules));
            config.setStatusesJson(serializeStatuses(request.getStatuses()));
            if (StringUtils.hasText(actorPrincipal)) {
                config.setUpdatedBy(actorPrincipal);
            }
            config.setUpdatedAt(LocalDateTime.now());
            LeadFlowConfig saved = leadFlowConfigRepository.save(config);
            syncStatusesFromFlowRules(sanitizedRules);
            try {
                LeadService leadService = leadServiceProvider.getIfAvailable();
                if (leadService != null) {
                    leadService.reassignLeadsForFlow(sanitizedRules);
                }
            } catch (Exception ignore) {
                // don't let reassign failures block the flow update
            }
            return toResponse(saved, scope);
        }

        Map<String, ScopedFlowState> scopedFlows = loadScopedFlows(config);
        ScopedFlowState scopedState = scopedFlows.get(scope.key());
        if (scopedState == null) {
            scopedState = new ScopedFlowState();
        }
        scopedState.defaultGroupId = request.getDefaultGroupId();
        scopedState.rules = sanitizedRules;
        scopedState.statuses = request.getStatuses();
        scopedState.updatedBy = actorPrincipal;
        scopedState.updatedAt = LocalDateTime.now();
        scopedFlows.put(scope.key(), scopedState);
        config.setScopedFlowJson(writeScopedFlows(scopedFlows));
        if (StringUtils.hasText(actorPrincipal)) {
            config.setUpdatedBy(actorPrincipal);
        }
        config.setUpdatedAt(LocalDateTime.now());
        LeadFlowConfig saved = leadFlowConfigRepository.save(config);
        syncStatusesFromFlowRules(sanitizedRules);
        return toResponse(saved, scope);
    }

    private LeadFlowConfig loadConfig() {
        return leadFlowConfigRepository.findById(FLOW_ID).orElseGet(() -> {
            LeadFlowConfig created = new LeadFlowConfig();
            created.setId(FLOW_ID);
            return created;
        });
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

    private Scope resolveScope(User actor, Long branchId, String institutionName) {
        if (branchId != null) {
            BranchMaster branch = branchMasterRepository.findByIdAndDeletedFalse(branchId)
                    .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
            return new Scope(branch.getId(), normalize(branch.getName()));
        }
        if (StringUtils.hasText(institutionName)) {
            String normalizedInstitutionName = normalize(institutionName);
            BranchMaster branch = branchMasterRepository.findFirstByNameIgnoreCaseAndDeletedFalseOrderByIdAsc(normalizedInstitutionName)
                    .orElse(null);
            return new Scope(branch == null ? null : branch.getId(), normalizedInstitutionName);
        }
        if (actor == null) {
            return Scope.global();
        }
        if (actor.getRole() != Role.SUPER_ADMIN) {
            return Scope.fromUser(actor);
        }
        if (StringUtils.hasText(actor.getInstitutionName())) {
            return Scope.fromUser(actor);
        }
        return Scope.global();
    }

    private LeadFlowResponse toResponse(LeadFlowConfig config, Scope scope) {
        ScopedFlowState state = scope.isGlobal()
                ? null
                : resolveScopedState(loadScopedFlows(config), scope);

        LeadFlowResponse response = new LeadFlowResponse();
        response.setBranchId(scope.isGlobal() ? null : scope.branchId);
        response.setInstitutionName(scope.isGlobal() ? null : scope.institutionName);
        if (state != null) {
            response.setDefaultGroupId(state.defaultGroupId);
            response.setRules(state.rules == null ? Collections.emptyList() : state.rules);
            response.setStatuses(state.statuses == null ? null : state.statuses);
            response.setUpdatedBy(state.updatedBy);
            response.setUpdatedAt(state.updatedAt);
            return response;
        }

        response.setDefaultGroupId(config.getDefaultGroupId());
        response.setRules(parseRules(config.getRulesJson()));
        response.setStatuses(parseStatuses(config.getStatusesJson()));
        response.setUpdatedBy(config.getUpdatedBy());
        response.setUpdatedAt(config.getUpdatedAt());
        return response;
    }

    private Map<String, ScopedFlowState> loadScopedFlows(LeadFlowConfig config) {
        try {
            if (!StringUtils.hasText(config.getScopedFlowJson())) {
                return new LinkedHashMap<>();
            }
            return objectMapper.readValue(config.getScopedFlowJson(), new TypeReference<Map<String, ScopedFlowState>>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private String writeScopedFlows(Map<String, ScopedFlowState> scopedFlows) {
        try {
            return objectMapper.writeValueAsString(scopedFlows);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to save scoped flow rules");
        }
    }

    private List<Map<String, Object>> sanitizeFlowRules(List<Map<String, Object>> rules, List<String> statuses) {
        if (rules == null) {
            return Collections.emptyList();
        }

        Map<String, String> selectedStatusByKey = new LinkedHashMap<>();
        if (statuses != null) {
            for (String status : statuses) {
                if (!StringUtils.hasText(status)) continue;
                selectedStatusByKey.putIfAbsent(normalizeStatusKey(status), status.trim());
            }
        }
        if (selectedStatusByKey.isEmpty()) {
            for (Map<String, Object> rule : rules) {
                if (rule == null) continue;
                Object status = rule.get("status");
                if (status == null || !StringUtils.hasText(status.toString())) continue;
                selectedStatusByKey.putIfAbsent(normalizeStatusKey(status.toString()), status.toString().trim());
            }
        }

        List<Map<String, Object>> sanitized = new java.util.ArrayList<>();
        for (Map<String, Object> rule : rules) {
            if (rule == null) continue;
            Object statusValue = rule.get("status");
            if (statusValue == null || !StringUtils.hasText(statusValue.toString())) continue;

            String statusKey = normalizeStatusKey(statusValue.toString());
            String canonicalStatus = selectedStatusByKey.get(statusKey);
            if (!StringUtils.hasText(canonicalStatus)) continue;

            Map<String, Object> cleanRule = new LinkedHashMap<>(rule);
            cleanRule.put("status", canonicalStatus);
            cleanRule.put("next", sanitizeNextMap(rule.get("next"), statusKey, selectedStatusByKey));
            sanitized.add(cleanRule);
        }
        return sanitized;
    }

    private Map<String, Object> sanitizeNextMap(Object rawNext,
                                                String currentStatusKey,
                                                Map<String, String> selectedStatusByKey) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        if (!(rawNext instanceof Map<?, ?> nextMap)) {
            return sanitized;
        }
        for (Map.Entry<?, ?> entry : nextMap.entrySet()) {
            if (entry.getKey() == null) continue;
            String nextKey = normalizeStatusKey(entry.getKey().toString());
            if (!StringUtils.hasText(nextKey) || nextKey.equals(currentStatusKey) || nextKey.equals("new lead")) {
                continue;
            }
            String canonicalNextStatus = selectedStatusByKey.get(nextKey);
            if (!StringUtils.hasText(canonicalNextStatus)) {
                continue;
            }
            sanitized.put(canonicalNextStatus, entry.getValue());
        }
        return sanitized;
    }

    private void syncStatusesFromFlowRules(List<Map<String, Object>> rules) {
        if (rules == null) return;

        Set<String> statuses = new HashSet<>();
        for (Map<String, Object> rule : rules) {
            if (rule == null) continue;
            String status = String.valueOf(rule.get("status") != null ? rule.get("status") : "").trim();
            if (!status.isEmpty()) {
                statuses.add(status);
            }
            Object next = rule.get("next");
            if (next instanceof Map<?, ?> nextMap) {
                for (Object key : nextMap.keySet()) {
                    String nextStatus = String.valueOf(key != null ? key : "").trim();
                    if (nextStatus.isEmpty()) continue;
                    statuses.add(nextStatus);
                }
            }
        }

        for (String status : statuses) {
            if (leadStatusRepository.existsByStatusNameIgnoreCaseAndDeletedFalse(status)) {
                continue;
            }
            LeadStatus row = new LeadStatus();
            row.setStatusId("LDSTS_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14));
            row.setStatusName(status);
            leadStatusRepository.save(row);
        }
    }

    private String serializeRules(List<Map<String, Object>> rules) {
        try {
            if (rules == null) {
                return null;
            }
            return objectMapper.writeValueAsString(rules);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to save flow rules");
        }
    }

    private List<Map<String, Object>> parseRules(String json) {
        try {
            if (!StringUtils.hasText(json)) {
                return Collections.emptyList();
            }
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String serializeStatuses(List<String> statuses) {
        try {
            if (statuses == null) return null;
            return objectMapper.writeValueAsString(statuses);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to save flow statuses");
        }
    }

    private List<String> parseStatuses(String json) {
        try {
            if (!StringUtils.hasText(json)) return null;
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeStatusKey(String value) {
        if (!StringUtils.hasText(value)) return "";
        String key = value.trim().toLowerCase(Locale.ROOT);
        return switch (key) {
            case "new" -> "new lead";
            case "requirement collected", "requirements collected" -> "requirement";
            case "design & production", "design and production" -> "design + production";
            case "stock requested" -> "stock request";
            default -> key;
        };
    }

    private ScopedFlowState resolveScopedState(Map<String, ScopedFlowState> scopedFlows, Scope scope) {
        ScopedFlowState exact = scopedFlows.get(scope.key());
        if (exact != null) {
            return exact;
        }
        if (scope.branchId != null && StringUtils.hasText(scope.institutionName)) {
            ScopedFlowState legacyByName = scopedFlows.get(scope.institutionName.toLowerCase(Locale.ROOT));
            if (legacyByName != null) {
                return legacyByName;
            }
        }
        String branchPrefix = scope.keyPrefix();
        if (!StringUtils.hasText(branchPrefix)) {
            return null;
        }
        for (Map.Entry<String, ScopedFlowState> entry : scopedFlows.entrySet()) {
            if (entry.getKey() != null && entry.getKey().startsWith(branchPrefix)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private static final class Scope {
        private final Long branchId;
        private final String institutionName;

        private Scope(Long branchId, String institutionName) {
            this.branchId = branchId;
            this.institutionName = institutionName;
        }

        static Scope global() {
            return new Scope(null, null);
        }

        static Scope fromUser(User user) {
            if (user == null) {
                return global();
            }
            String institution = StringUtils.hasText(user.getInstitutionName()) ? user.getInstitutionName().trim() : null;
            if (!StringUtils.hasText(institution)) {
                return global();
            }
            return new Scope(null, institution);
        }

        boolean isGlobal() {
            return !StringUtils.hasText(institutionName);
        }

        String key() {
            if (isGlobal()) {
                return GLOBAL_SCOPE_KEY;
            }
            if (branchId != null) {
                return "branch:" + branchId;
            }
            return institutionName.toLowerCase(Locale.ROOT);
        }

        String keyPrefix() {
            if (isGlobal()) {
                return GLOBAL_SCOPE_KEY;
            }
            if (branchId != null) {
                return "branch:" + branchId;
            }
            return institutionName.toLowerCase(Locale.ROOT);
        }
    }

    public static final class ScopedFlowState {
        private Long defaultGroupId;
        private List<Map<String, Object>> rules;
        private List<String> statuses;
        private String updatedBy;
        private LocalDateTime updatedAt;

        public Long getDefaultGroupId() {
            return defaultGroupId;
        }

        public void setDefaultGroupId(Long defaultGroupId) {
            this.defaultGroupId = defaultGroupId;
        }

        public List<Map<String, Object>> getRules() {
            return rules;
        }

        public void setRules(List<Map<String, Object>> rules) {
            this.rules = rules;
        }

        public List<String> getStatuses() {
            return statuses;
        }

        public void setStatuses(List<String> statuses) {
            this.statuses = statuses;
        }

        public String getUpdatedBy() {
            return updatedBy;
        }

        public void setUpdatedBy(String updatedBy) {
            this.updatedBy = updatedBy;
        }

        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }
}
