package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.LeadChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeadChatMessageRepository extends JpaRepository<LeadChatMessage, Long> {
    List<LeadChatMessage> findByThread_IdOrderByCreatedAtAsc(Long threadId);

    java.util.Optional<LeadChatMessage> findByIdAndThread_Lead_Id(Long id, Long leadId);

    @org.springframework.data.jpa.repository.Query(
            "select m from LeadChatMessage m " +
            "where m.thread.lead.id in :leadIds and m.createdAt > :since " +
            "order by m.createdAt desc"
    )
    List<LeadChatMessage> findRecentByLeadIds(
            @org.springframework.data.repository.query.Param("leadIds") List<Long> leadIds,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since
    );
}
