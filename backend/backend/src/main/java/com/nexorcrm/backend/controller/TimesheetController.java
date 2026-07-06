package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.TimesheetRequest;
import com.nexorcrm.backend.dto.TimesheetResponse;
import com.nexorcrm.backend.service.TimesheetService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timesheets")
public class TimesheetController {

    private final TimesheetService service;

    public TimesheetController(TimesheetService service) {
        this.service = service;
    }

    @GetMapping
    public List<TimesheetResponse> listAll() {
        return service.listAll();
    }

    @PostMapping
    public TimesheetResponse create(@Valid @RequestBody TimesheetRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public TimesheetResponse update(@PathVariable Long id, @Valid @RequestBody TimesheetRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
