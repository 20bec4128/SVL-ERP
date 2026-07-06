package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.TrainingRequest;
import com.nexorcrm.backend.dto.TrainingResponse;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.Trainer;
import com.nexorcrm.backend.entity.Training;
import com.nexorcrm.backend.entity.TrainingEmployee;
import com.nexorcrm.backend.entity.TrainingType;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.TrainerRepository;
import com.nexorcrm.backend.repo.TrainingEmployeeRepository;
import com.nexorcrm.backend.repo.TrainingRepository;
import com.nexorcrm.backend.repo.TrainingTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TrainingEmployeeRepository trainingEmployeeRepository;
    private final TrainingTypeRepository trainingTypeRepository;
    private final TrainerRepository trainerRepository;
    private final EmployeeRepository employeeRepository;

    public TrainingService(TrainingRepository trainingRepository,
                           TrainingEmployeeRepository trainingEmployeeRepository,
                           TrainingTypeRepository trainingTypeRepository,
                           TrainerRepository trainerRepository,
                           EmployeeRepository employeeRepository) {
        this.trainingRepository = trainingRepository;
        this.trainingEmployeeRepository = trainingEmployeeRepository;
        this.trainingTypeRepository = trainingTypeRepository;
        this.trainerRepository = trainerRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<TrainingResponse> list() {
        return trainingRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public TrainingResponse create(TrainingRequest request) {
        Training row = new Training();
        apply(row, request);
        Training saved = trainingRepository.save(row);
        replaceEmployees(saved, request.getEmployeeIds());
        return toResponse(saved);
    }

    public TrainingResponse update(Long id, TrainingRequest request) {
        Training row = trainingRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Training not found"));
        apply(row, request);
        Training saved = trainingRepository.save(row);
        replaceEmployees(saved, request.getEmployeeIds());
        return toResponse(saved);
    }

    public void delete(Long id) {
        Training row = trainingRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Training not found"));
        row.setDeleted(true);
        trainingRepository.save(row);
    }

    private void apply(Training row, TrainingRequest request) {
        TrainingType type = trainingTypeRepository.findById(request.getTrainingTypeId())
                .orElseThrow(() -> new EntityNotFoundException("Training type not found"));
        Trainer trainer = trainerRepository.findByIdAndDeletedFalse(request.getTrainerId())
                .orElseThrow(() -> new EntityNotFoundException("Trainer not found"));

        row.setTrainingType(type);
        row.setTrainer(trainer);
        row.setCost(request.getCost());
        row.setStartDate(request.getStartDate());
        row.setEndDate(request.getEndDate());
        row.setDescription(request.getDescription());
        row.setStatus(request.getStatus());
    }

    private void replaceEmployees(Training training, List<Long> employeeIds) {
        trainingEmployeeRepository.deleteByTraining_Id(training.getId());
        if (employeeIds == null || employeeIds.isEmpty()) return;
        List<TrainingEmployee> rows = new ArrayList<>();
        for (Long empId : employeeIds) {
            if (empId == null) continue;
            TrainingEmployee row = new TrainingEmployee();
            row.setTraining(training);
            row.setEmployeeId(empId);
            rows.add(row);
        }
        trainingEmployeeRepository.saveAll(rows);
    }

    private TrainingResponse toResponse(Training training) {
        TrainingResponse res = new TrainingResponse();
        res.setId(training.getId());
        if (training.getTrainingType() != null) {
            res.setTrainingTypeId(training.getTrainingType().getId());
            res.setTrainingTypeName(training.getTrainingType().getTypeName());
        }
        if (training.getTrainer() != null) {
            res.setTrainerId(training.getTrainer().getId());
            res.setTrainerName(
                    (training.getTrainer().getFirstName() + " " + training.getTrainer().getLastName()).trim()
            );
        }
        List<Long> ids = training.getEmployees().stream().map(TrainingEmployee::getEmployeeId).toList();
        res.setEmployeeIds(ids);
        if (!ids.isEmpty()) {
            var map = employeeRepository.findAllById(ids).stream()
                    .collect(java.util.stream.Collectors.toMap(Employee::getId, e -> e.getName() != null ? e.getName() : ""));
            List<String> names = new ArrayList<>();
            for (Long id : ids) {
                String name = map.getOrDefault(id, "");
                if (!name.isBlank()) names.add(name);
            }
            res.setEmployeeNames(names);
        } else {
            res.setEmployeeNames(List.of());
        }
        res.setCost(training.getCost());
        res.setStartDate(training.getStartDate());
        res.setEndDate(training.getEndDate());
        res.setDescription(training.getDescription());
        res.setStatus(training.getStatus());
        return res;
    }
}
