package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.StockRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockRequestLogRepository extends JpaRepository<StockRequestLog, Long> {
    List<StockRequestLog> findByStockRequest_IdOrderByCreatedAtAsc(Long stockRequestId);
}
