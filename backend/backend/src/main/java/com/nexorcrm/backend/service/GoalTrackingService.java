package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.GoalTrackingRequest;
import com.nexorcrm.backend.dto.GoalTrackingResponse;
import com.nexorcrm.backend.entity.GoalTracking;
import com.nexorcrm.backend.repo.GoalTrackingRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GoalTrackingService {

    private final GoalTrackingRepository repository;

    public GoalTrackingService(GoalTrackingRepository repository) {
        this.repository = repository;
    }

    public List<GoalTrackingResponse> listAll() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream().map(this::toResponse).toList();
    }

    public GoalTrackingResponse create(GoalTrackingRequest request) {
        GoalTracking goal = new GoalTracking();
        apply(goal, request);
        GoalTracking saved = repository.save(goal);
        return toResponse(saved);
    }

    public GoalTrackingResponse update(Long id, GoalTrackingRequest request) {
        GoalTracking goal = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));
        if (Boolean.TRUE.equals(goal.getDeleted())) {
            throw new EntityNotFoundException("Goal not found");
        }
        apply(goal, request);
        GoalTracking saved = repository.save(goal);
        return toResponse(saved);
    }

    public void delete(Long id) {
        GoalTracking goal = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));
        goal.setDeleted(true);
        repository.save(goal);
    }

    private void apply(GoalTracking goal, GoalTrackingRequest request) {
        goal.setGoalType(request.getGoalType() != null ? request.getGoalType().trim() : null);
        goal.setSubject(request.getSubject() != null ? request.getSubject().trim() : null);
        goal.setTargetAchievement(request.getTargetAchievement() != null ? request.getTargetAchievement().trim() : null);
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());
        goal.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        goal.setStatus(request.getStatus() != null ? request.getStatus().trim() : "Active");

        Integer progress = request.getProgressPercent();
        if (progress == null) progress = 0;
        if (progress < 0) progress = 0;
        if (progress > 100) progress = 100;
        goal.setProgressPercent(progress);
    }

    private GoalTrackingResponse toResponse(GoalTracking goal) {
        GoalTrackingResponse r = new GoalTrackingResponse();
        r.setId(goal.getId());
        r.setGoalType(goal.getGoalType());
        r.setSubject(goal.getSubject());
        r.setTargetAchievement(goal.getTargetAchievement());
        r.setStartDate(goal.getStartDate());
        r.setEndDate(goal.getEndDate());
        r.setDescription(goal.getDescription());
        r.setStatus(goal.getStatus());
        r.setProgressPercent(goal.getProgressPercent());
        return r;
    }
}
