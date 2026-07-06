package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.SecurityDisallowedUsername;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SecurityDisallowedUsernameRepository extends JpaRepository<SecurityDisallowedUsername, Long> {
    boolean existsByUsername(String username);

    List<SecurityDisallowedUsername> findAllByOrderByUsernameAsc();

    @Transactional
    void deleteByUsernameIn(List<String> usernames);
}
