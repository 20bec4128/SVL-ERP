package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByDeletedFalseOrderByCreatedAtDesc();
    List<Lead> findByDeletedFalseAndPaymentVerificationAssignedToUserIdIsNotNullOrderByUpdatedAtDesc();
    List<Lead> findByDeletedFalseAndBudgetVerificationAssignedToUserIdIsNotNullOrderByUpdatedAtDesc();
    List<Lead> findByDeletedFalseAndAssignedGroupIdOrderByCreatedAtDesc(Long assignedGroupId);
    List<Lead> findByDeletedFalseAndOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);

    // leads for which a payment employee retained ownership while the status is
    // design; used to keep the record in their table during design phase.
    List<Lead> findByDeletedFalseAndPaymentOwnerIdOrderByCreatedAtDesc(Long paymentOwnerId);

    Optional<Lead> findByIdAndDeletedFalse(Long id);
    Optional<Lead> findTopByDeletedFalseAndEmailNormalizedOrderByCreatedAtDesc(String emailNormalized);

    boolean existsByDeletedFalseAndProjectNameIgnoreCaseAndMobileNormalized(String projectName, String mobileNormalized);

    boolean existsByDeletedFalseAndProjectNameIgnoreCaseAndEmailNormalized(String projectName, String emailNormalized);

    long countByDeletedFalse();

    // duplicate detection queries
    List<Lead> findByDeletedFalseAndIsDuplicateTrueOrderByCreatedAtDesc();

    Optional<Lead> findFirstByDeletedFalseAndIsDuplicateFalseAndMobileNormalizedOrderByCreatedAtDesc(String mobileNormalized);
    Optional<Lead> findFirstByDeletedFalseAndIsDuplicateFalseAndEmailNormalizedOrderByCreatedAtDesc(String emailNormalized);
    Optional<Lead> findFirstByDeletedFalseAndIsDuplicateFalseAndMobileNormalizedAndIdNotOrderByCreatedAtDesc(String mobileNormalized, Long id);
    Optional<Lead> findFirstByDeletedFalseAndIsDuplicateFalseAndEmailNormalizedAndIdNotOrderByCreatedAtDesc(String emailNormalized, Long id);
}
