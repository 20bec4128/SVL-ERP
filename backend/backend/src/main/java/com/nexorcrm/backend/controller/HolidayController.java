package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.HolidayRequest;
import com.nexorcrm.backend.dto.HolidayResponse;
import com.nexorcrm.backend.service.HolidayService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayService service;

    public HolidayController(HolidayService service) {
        this.service = service;
    }

    @GetMapping
    public List<HolidayResponse> list() {
        return service.list();
    }

    @PostMapping
    public HolidayResponse create(@Valid @RequestBody HolidayRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public HolidayResponse update(@PathVariable Long id, @Valid @RequestBody HolidayRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
