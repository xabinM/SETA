package com.AIce.Backend.domain.dashboard.repository;

import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenDaily;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenDaily;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenDailyId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.*;
import java.util.*;

public interface UserSavedTokenDailyRepository extends JpaRepository<UserSavedTokenDaily, UserSavedTokenDailyId> {
    Optional<UserSavedTokenDaily> findTopByUserIdOrderByWindowStartDesc(String userId);
}