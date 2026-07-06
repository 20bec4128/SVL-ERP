package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.GoalTypeRequest;
import com.nexorcrm.backend.dto.GoalTypeResponse;
import com.nexorcrm.backend.entity.GoalType;
import com.nexorcrm.backend.repo.GoalTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GoalTypeService {

    private final GoalTypeRepository repository;

    public GoalTypeService(GoalTypeRepository repository) {
        this.repository = repository;
    }

    public List<GoalTypeResponse> listAll() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream().map(this::toResponse).toList();
    }

    public GoalTypeResponse create(GoalTypeRequest request) {
        GoalType type = new GoalType();
        apply(type, request);
        GoalType saved = repository.save(type);
        return toResponse(saved);
    }

    public GoalTypeResponse update(Long id, GoalTypeRequest request) {
        GoalType type = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Goal type not found"));
        if (Boolean.TRUE.equals(type.getDeleted())) {
            throw new EntityNotFoundException("Goal type not found");
        }
        apply(type, request);
        GoalType saved = repository.save(type);
        return toResponse(saved);
    }

    public void delete(Long id) {
        GoalType type = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Goal type not found"));
        type.setDeleted(true);
        repository.save(type);
    }

    private void apply(GoalType type, GoalTypeRequest request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isBlank()) throw new IllegalArgumentException("Goal type name is required");
        type.setName(name);
        type.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        type.setStatus(request.getStatus() != null ? request.getStatus().trim() : "Active");
    }

    private GoalTypeResponse toResponse(GoalType type) {
        GoalTypeResponse r = new GoalTypeResponse();
        r.setId(type.getId());
        r.setName(type.getName());
        r.setDescription(type.getDescription());
        r.setStatus(type.getStatus());
        return r;
    }
}
