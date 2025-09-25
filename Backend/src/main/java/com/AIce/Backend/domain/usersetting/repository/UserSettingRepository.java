package com.AIce.Backend.domain.usersetting.repository;

import com.AIce.Backend.domain.usersetting.entity.UserSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserSettingRepository extends JpaRepository<UserSetting, UUID> {
    Optional<UserSetting> findByUser_UserId(Long userId);
    boolean existsByUser_UserId(Long userId);
}
