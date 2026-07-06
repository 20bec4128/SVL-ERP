package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    @Query("SELECT r FROM ChatRoom r JOIN r.memberUserIds m WHERE m = :userId")
    List<ChatRoom> findRoomsByMemberUserId(@Param("userId") Long userId);
}
