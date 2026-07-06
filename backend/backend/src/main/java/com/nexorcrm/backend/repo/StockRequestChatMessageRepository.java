package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.StockRequestChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockRequestChatMessageRepository extends JpaRepository<StockRequestChatMessage, Long> {
    List<StockRequestChatMessage> findByThread_IdOrderByCreatedAtAsc(Long threadId);
    java.util.Optional<StockRequestChatMessage> findByIdAndThread_StockRequest_Id(Long id, Long requestId);

    @org.springframework.data.jpa.repository.Query(
            "select m from StockRequestChatMessage m " +
            "where m.thread.stockRequest.id in :requestIds and m.createdAt > :since " +
            "order by m.createdAt desc"
    )
    List<StockRequestChatMessage> findRecentByRequestIds(
            @org.springframework.data.repository.query.Param("requestIds") List<Long> requestIds,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since
    );
}
