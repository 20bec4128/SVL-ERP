package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.TrainingTypeRequest;
import com.nexorcrm.backend.dto.TrainingTypeResponse;
import com.nexorcrm.backend.service.TrainingTypeService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/training-types")
public class TrainingTypeController {

    private final TrainingTypeService trainingTypeService;

    public TrainingTypeController(TrainingTypeService trainingTypeService) {
        this.trainingTypeService = trainingTypeService;
    }

    @GetMapping
    public List<TrainingTypeResponse> list(Authentication authentication) {
        return trainingTypeService.list(authentication.getName());
    }

    @PostMapping
    public TrainingTypeResponse create(@Valid @RequestBody TrainingTypeRequest request,
                                       Authentication authentication) {
        return trainingTypeService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public TrainingTypeResponse update(@PathVariable("id") Long id,
                                       @Valid @RequestBody TrainingTypeRequest request,
                                       Authentication authentication) {
        return trainingTypeService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        trainingTypeService.delete(id, authentication.getName());
        return new ApiMessageResponse("Training type deleted successfully");
    }
}
