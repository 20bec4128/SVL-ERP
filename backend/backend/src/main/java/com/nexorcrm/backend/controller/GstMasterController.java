package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.GstMasterRequest;
import com.nexorcrm.backend.dto.GstMasterResponse;
import com.nexorcrm.backend.service.GstMasterService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gst-master")
public class GstMasterController {

    private final GstMasterService service;

    public GstMasterController(GstMasterService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<GstMasterResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<GstMasterResponse>> getActive() {
        return ResponseEntity.ok(service.getActive());
    }

    @PostMapping
    public ResponseEntity<GstMasterResponse> create(@RequestBody GstMasterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GstMasterResponse> update(@PathVariable Long id, @RequestBody GstMasterRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
