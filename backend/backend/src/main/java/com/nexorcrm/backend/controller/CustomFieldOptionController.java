package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.CustomFieldOptionRequest;
import com.nexorcrm.backend.dto.CustomFieldOptionResponse;
import com.nexorcrm.backend.service.CustomFieldOptionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/custom-options")
public class CustomFieldOptionController {

    private final CustomFieldOptionService service;

    public CustomFieldOptionController(CustomFieldOptionService service) {
        this.service = service;
    }

    @GetMapping
    public List<CustomFieldOptionResponse> list(
            @RequestParam Long typeId,
            @RequestParam(required = false) Long subtypeId,
            @RequestParam String fieldKey) {
        return service.list(typeId, subtypeId, fieldKey);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomFieldOptionResponse upsert(@RequestBody CustomFieldOptionRequest req) {
        return service.upsert(req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
