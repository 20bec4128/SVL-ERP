package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByDeletedFalseOrderByIdDesc();
}
