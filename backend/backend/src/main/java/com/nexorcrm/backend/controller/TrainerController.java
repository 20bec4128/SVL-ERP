package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.TrainerRequest;
import com.nexorcrm.backend.dto.TrainerResponse;
import com.nexorcrm.backend.service.TrainerService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainers")
public class TrainerController {

    private final TrainerService trainerService;

    public TrainerController(TrainerService trainerService) {
        this.trainerService = trainerService;
    }

    @GetMapping
    public List<TrainerResponse> list(Authentication authentication) {
        return trainerService.list(authentication.getName());
    }

    @PostMapping
    public TrainerResponse create(@Valid @RequestBody TrainerRequest request,
                                  Authentication authentication) {
        return trainerService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public TrainerResponse update(@PathVariable("id") Long id,
                                  @Valid @RequestBody TrainerRequest request,
                                  Authentication authentication) {
        return trainerService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id,
                                     Authentication authentication) {
        trainerService.delete(id, authentication.getName());
        return new ApiMessageResponse("Trainer deleted successfully");
    }
}
