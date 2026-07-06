package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.CustomFieldOptionRequest;
import com.nexorcrm.backend.dto.CustomFieldOptionResponse;
import com.nexorcrm.backend.entity.CustomFieldOption;
import com.nexorcrm.backend.repo.CustomFieldOptionRepository;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomFieldOptionService {

    private static final int MAX_OPTIONS_PER_SCOPE = 200;

    private final CustomFieldOptionRepository repo;

    public CustomFieldOptionService(CustomFieldOptionRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<CustomFieldOptionResponse> list(Long typeId, Long subtypeId, String fieldKey) {
        return repo.findByScope(typeId, subtypeId, fieldKey)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CustomFieldOptionResponse upsert(CustomFieldOptionRequest req) {
        if (req.getTypeId() == null) {
            throw new IllegalArgumentException("typeId is required");
        }
        String raw = req.getValueRaw() == null ? "" : req.getValueRaw().strip();
        if (raw.isEmpty()) {
            throw new IllegalArgumentException("valueRaw must not be blank");
        }
        String norm = normalize(raw);

        // Deduplicate: return existing if already stored
        return repo.findExisting(req.getTypeId(), req.getSubtypeId(), req.getFieldKey(), norm)
                .map(this::toResponse)
                .orElseGet(() -> {
                    // Enforce cap: if at limit, delete oldest before inserting
                    List<CustomFieldOption> existing =
                            repo.findByScope(req.getTypeId(), req.getSubtypeId(), req.getFieldKey());
                    if (existing.size() >= MAX_OPTIONS_PER_SCOPE) {
                        // existing is ordered by createdAt DESC, so last element is oldest
                        CustomFieldOption oldest = existing.get(existing.size() - 1);
                        if (oldest != null) repo.delete(oldest);
                    }

                    CustomFieldOption opt = new CustomFieldOption();
                    opt.setTypeId(req.getTypeId());
                    opt.setSubtypeId(req.getSubtypeId());
                    opt.setFieldKey(req.getFieldKey());
                    opt.setValueRaw(raw);
                    opt.setValueNorm(norm);
                    return toResponse(repo.save(opt));
                });
    }

    @Transactional
    public void delete(Long id) {
        if (id == null) return;
        try {
            repo.deleteById(id);
        } catch (EmptyResultDataAccessException ignored) {
            // Idempotent delete: treat missing row as success.
        }
    }

    static String normalize(String value) {
        if (value == null) return "";
        return value.strip().toLowerCase().replaceAll("\\s+", " ");
    }

    private CustomFieldOptionResponse toResponse(CustomFieldOption opt) {
        CustomFieldOptionResponse r = new CustomFieldOptionResponse();
        r.setId(opt.getId());
        r.setTypeId(opt.getTypeId());
        r.setSubtypeId(opt.getSubtypeId());
        r.setFieldKey(opt.getFieldKey());
        r.setValueRaw(opt.getValueRaw());
        r.setCreatedAt(opt.getCreatedAt());
        return r;
    }
}
