package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.MailSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MailSettingsRepository extends JpaRepository<MailSettings, Long> {
}

