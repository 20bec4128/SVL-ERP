package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.EmailNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailNotificationLogRepository extends JpaRepository<EmailNotificationLog, Long> {
    Optional<EmailNotificationLog> findTopByRecipientEmailOrderByLastSentAtDesc(String recipientEmail);
}
