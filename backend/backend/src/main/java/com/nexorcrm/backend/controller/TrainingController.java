package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.TrainingRequest;
import com.nexorcrm.backend.dto.TrainingResponse;
import com.nexorcrm.backend.service.TrainingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainings")
public class TrainingController {

    private final TrainingService trainingService;

    public TrainingController(TrainingService trainingService) {
        this.trainingService = trainingService;
    }

    @GetMapping
    public List<TrainingResponse> list() {
        return trainingService.list();
    }

    @PostMapping
    public TrainingResponse create(@Valid @RequestBody TrainingRequest request) {
        return trainingService.create(request);
    }

    @PutMapping("/{id}")
    public TrainingResponse update(@PathVariable Long id, @Valid @RequestBody TrainingRequest request) {
        return trainingService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        trainingService.delete(id);
    }
}
