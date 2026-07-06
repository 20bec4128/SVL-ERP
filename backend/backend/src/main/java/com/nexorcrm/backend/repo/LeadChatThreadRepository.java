package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.LeadChatThread;
import com.nexorcrm.backend.entity.LeadChatThreadType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeadChatThreadRepository extends JpaRepository<LeadChatThread, Long> {
    Optional<LeadChatThread> findByLead_IdAndThreadType(Long leadId, LeadChatThreadType threadType);
}
