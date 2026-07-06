package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.StockRequestChatThread;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockRequestChatThreadRepository extends JpaRepository<StockRequestChatThread, Long> {
    Optional<StockRequestChatThread> findByStockRequest_Id(Long requestId);
}
