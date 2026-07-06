package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.RefreshToken;
import com.nexorcrm.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUserOrderByExpiryDateDesc(User user);

    List<RefreshToken> findByUserAndRevokedFalseOrderByExpiryDateDesc(User user);

    List<RefreshToken> findByIdInAndUserAndRevokedFalse(List<Long> ids, User user);

    @Transactional
    void deleteByUser(User user);
}
