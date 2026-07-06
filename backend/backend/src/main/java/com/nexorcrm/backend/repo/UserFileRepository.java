package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.UserFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserFileRepository extends JpaRepository<UserFile, Long> {
    List<UserFile> findByUserIdAndParentId(Long userId, Long parentId);
    List<UserFile> findByUserIdAndParentIdIsNull(Long userId);
    List<UserFile> findByUserIdAndNameContainingIgnoreCase(Long userId, String name);
}
