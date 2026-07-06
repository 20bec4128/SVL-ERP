package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.StockRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockRequestRepository extends JpaRepository<StockRequest, Long> {
    List<StockRequest> findByRequestedBy(Long requestedBy);
    List<StockRequest> findByAssignedTo(Long assignedTo);
    List<StockRequest> findByStatus(String status);
    List<StockRequest> findByLead_Id(Long leadId);

    /**
     * Find most recent stock request whose assignee is one of the given user ids.
     * Used by StockRequestService.round‑robin picker.
     */
    java.util.Optional<StockRequest> findTopByAssignedToInOrderByCreatedAtDesc(List<Long> assignedTo);
}
