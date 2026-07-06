package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.PriceListEntryRequest;
import com.nexorcrm.backend.dto.PriceListEntryResponse;
import com.nexorcrm.backend.dto.PriceListPageResponse;
import com.nexorcrm.backend.dto.PriceListCountResponse;
import com.nexorcrm.backend.dto.PriceListSummaryResponse;
import com.nexorcrm.backend.entity.PriceListEntry;
import com.nexorcrm.backend.repo.PriceListEntryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PriceListService {

    private final PriceListEntryRepository repo;

    public PriceListService(PriceListEntryRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public PriceListPageResponse listPaged(
            Integer page,
            Integer size,
            String search,
            Long categoryId,
            Long typeId,
            Long subtypeId
    ) {
        int safePage = page == null ? 0 : Math.max(0, page);
        int safeSize = size == null ? 10 : Math.max(1, size);
        String normalizedSearch = search == null ? null : search.trim();
        if (normalizedSearch != null && normalizedSearch.isEmpty()) {
            normalizedSearch = null;
        }

        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<PriceListEntry> pageResult = repo.findAllFiltered(
                categoryId,
                typeId,
                subtypeId,
                normalizedSearch,
                pageable
        );

        return new PriceListPageResponse(
                pageResult.getContent().stream().map(this::toResponse).toList(),
                pageResult.getNumber() + 1,
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public PriceListSummaryResponse summary(Long categoryId, Long typeId) {
        var typeCounts = repo.countTypesByCategory(categoryId).stream()
                .map(row -> new PriceListCountResponse(
                        row.getId(),
                        row.getName(),
                        row.getTotalCount() == null ? 0L : row.getTotalCount()
                ))
                .toList();

        var subtypeCounts = typeId == null
                ? java.util.List.<PriceListCountResponse>of()
                : repo.countSubtypesByType(typeId).stream()
                .map(row -> new PriceListCountResponse(
                        row.getId(),
                        row.getName(),
                        row.getTotalCount() == null ? 0L : row.getTotalCount()
                ))
                .toList();

        return new PriceListSummaryResponse(typeCounts, subtypeCounts);
    }

    @Transactional(readOnly = true)
    public PriceListEntryResponse getById(Long id) {
        PriceListEntry entry = repo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Price list entry not found"));
        return toResponse(entry);
    }

    @Transactional
    public PriceListEntryResponse create(PriceListEntryRequest req) {
        PriceListEntry entry = new PriceListEntry();
        entry.setCategoryId(req.getCategoryId());
        entry.setTypeId(req.getTypeId());
        entry.setSubtypeId(req.getSubtypeId());
        entry.setTypeName(req.getTypeName());
        entry.setSubtypeName(req.getSubtypeName());
        entry.setVariantFields(req.getVariantFields());
        entry.setQuantitySlabs(req.getQuantitySlabs());
        entry = repo.save(entry);
        return toResponse(entry);
    }

    @Transactional
    public PriceListEntryResponse update(Long id, PriceListEntryRequest req) {
        PriceListEntry entry = repo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Price list entry not found"));
        entry.setCategoryId(req.getCategoryId());
        entry.setTypeId(req.getTypeId());
        entry.setSubtypeId(req.getSubtypeId());
        entry.setTypeName(req.getTypeName());
        entry.setSubtypeName(req.getSubtypeName());
        entry.setVariantFields(req.getVariantFields());
        entry.setQuantitySlabs(req.getQuantitySlabs());
        entry = repo.save(entry);
        return toResponse(entry);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new EntityNotFoundException("Price list entry not found");
        }
        repo.deleteById(id);
    }

    private PriceListEntryResponse toResponse(PriceListEntry entry) {
        PriceListEntryResponse resp = new PriceListEntryResponse();
        resp.setId(entry.getId());
        resp.setCategoryId(entry.getCategoryId());
        resp.setTypeId(entry.getTypeId());
        resp.setSubtypeId(entry.getSubtypeId());
        resp.setTypeName(entry.getTypeName());
        resp.setSubtypeName(entry.getSubtypeName());
        resp.setVariantFields(entry.getVariantFields());
        resp.setQuantitySlabs(entry.getQuantitySlabs());
        return resp;
    }
}
