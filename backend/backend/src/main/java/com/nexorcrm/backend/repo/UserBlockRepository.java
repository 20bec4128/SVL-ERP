package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    Optional<UserBlock> findByUserIdAndBlockedUserId(Long userId, Long blockedUserId);
    List<UserBlock> findByUserId(Long userId);
}
