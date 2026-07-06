package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.TicketRequest;
import com.nexorcrm.backend.dto.TicketResponse;
import com.nexorcrm.backend.entity.Ticket;
import com.nexorcrm.backend.entity.TicketCategory;
import com.nexorcrm.backend.repo.TicketCategoryRepository;
import com.nexorcrm.backend.repo.TicketRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCategoryRepository categoryRepository;

    public TicketService(TicketRepository ticketRepository, TicketCategoryRepository categoryRepository) {
        this.ticketRepository = ticketRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<TicketResponse> list() {
        return ticketRepository.findByDeletedFalseOrderByIdDesc()
                .stream().map(this::toResponse).toList();
    }

    public TicketResponse create(TicketRequest request) {
        TicketCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));

        Ticket t = new Ticket();
        apply(t, request);
        t.setCategory(category);
        return toResponse(ticketRepository.save(t));
    }

    public TicketResponse update(Long id, TicketRequest request) {
        Ticket t = ticketRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ticket not found"));
        if (Boolean.TRUE.equals(t.getDeleted())) {
            throw new EntityNotFoundException("Ticket not found");
        }

        TicketCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));

        apply(t, request);
        t.setCategory(category);
        return toResponse(ticketRepository.save(t));
    }

    public void delete(Long id) {
        Ticket t = ticketRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ticket not found"));
        t.setDeleted(true);
        ticketRepository.save(t);
    }

    private void apply(Ticket t, TicketRequest r) {
        t.setTitle(r.getTitle());
        t.setSubject(r.getSubject());
        t.setAssignedTo(r.getAssignedTo());
        t.setDescription(r.getDescription());
        t.setPriority(normalizePriority(r.getPriority()));
        t.setStatus(normalizeStatus(r.getStatus()));
    }

    private String normalizePriority(String priority) {
        String p = (priority == null ? "LOW" : priority).trim().toUpperCase();
        return switch (p) {
            case "HIGH", "MEDIUM", "LOW" -> p;
            default -> "LOW";
        };
    }

    private String normalizeStatus(String status) {
        String s = (status == null ? "OPEN" : status).trim().toUpperCase();
        return switch (s) {
            case "OPEN", "ON_HOLD", "REOPENED", "CLOSED", "IN_PROGRESS" -> s;
            default -> "OPEN";
        };
    }

    private TicketResponse toResponse(Ticket t) {
        TicketResponse r = new TicketResponse();
        r.setId(t.getId());
        r.setTitle(t.getTitle());
        r.setCategoryId(t.getCategory().getId());
        r.setCategoryName(t.getCategory().getName());
        r.setSubject(t.getSubject());
        r.setAssignedTo(t.getAssignedTo());
        r.setDescription(t.getDescription());
        r.setPriority(t.getPriority());
        r.setStatus(t.getStatus());
        r.setCreatedAt(t.getCreatedAt());
        r.setUpdatedAt(t.getUpdatedAt());
        return r;
    }
}
