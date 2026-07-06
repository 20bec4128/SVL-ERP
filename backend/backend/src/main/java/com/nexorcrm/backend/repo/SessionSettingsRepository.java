package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.SessionSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionSettingsRepository extends JpaRepository<SessionSettings, Long> {
}
