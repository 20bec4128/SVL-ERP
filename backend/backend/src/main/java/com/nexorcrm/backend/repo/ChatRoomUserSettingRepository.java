package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ChatRoomUserSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ChatRoomUserSettingRepository extends JpaRepository<ChatRoomUserSetting, Long> {
    Optional<ChatRoomUserSetting> findByChatRoomIdAndUserId(Long chatRoomId, Long userId);
}
