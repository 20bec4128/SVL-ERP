package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.HolidayRequest;
import com.nexorcrm.backend.dto.HolidayResponse;
import com.nexorcrm.backend.entity.Holiday;
import com.nexorcrm.backend.repo.HolidayRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HolidayService {

    private final HolidayRepository repository;

    public HolidayService(HolidayRepository repository) {
        this.repository = repository;
    }

    public List<HolidayResponse> list() {
        return repository.findByDeletedFalseOrderByDateAsc()
                .stream().map(this::toResponse).toList();
    }

    public HolidayResponse create(HolidayRequest request) {
        Holiday h = new Holiday();
        apply(h, request);
        return toResponse(repository.save(h));
    }

    public HolidayResponse update(Long id, HolidayRequest request) {
        Holiday h = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Holiday not found"));
        if (Boolean.TRUE.equals(h.getDeleted())) {
            throw new EntityNotFoundException("Holiday not found");
        }
        apply(h, request);
        return toResponse(repository.save(h));
    }

    public void delete(Long id) {
        Holiday h = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Holiday not found"));
        h.setDeleted(true);
        repository.save(h);
    }

    private void apply(Holiday h, HolidayRequest r) {
        h.setTitle(r.getTitle().trim());
        h.setDate(r.getDate());
        h.setDescription(r.getDescription());
        h.setStatus(normalizeStatus(r.getStatus()));
    }

    private String normalizeStatus(String status) {
        String s = (status == null ? "ACTIVE" : status).trim().toUpperCase();
        return "INACTIVE".equals(s) ? "INACTIVE" : "ACTIVE";
    }

    private HolidayResponse toResponse(Holiday h) {
        HolidayResponse r = new HolidayResponse();
        r.setId(h.getId());
        r.setTitle(h.getTitle());
        r.setDate(h.getDate());
        r.setDescription(h.getDescription());
        r.setStatus(h.getStatus());
        return r;
    }
}
