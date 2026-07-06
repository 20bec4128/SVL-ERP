package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.DimensionMasterResponse;
import com.nexorcrm.backend.service.DimensionMasterService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dimension-masters")
@CrossOrigin(origins = "http://localhost:3000")
public class DimensionMasterController {

    private final DimensionMasterService service;

    public DimensionMasterController(DimensionMasterService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<DimensionMasterResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<DimensionMasterResponse> create(@RequestBody Map<String, String> body) {
        DimensionMasterResponse created = service.add(body == null ? null : body.get("name"));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
