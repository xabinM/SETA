package com.AIce.Backend.domain.dashboard.repository;

import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenDaily;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.*;

public interface GlobalSavedTokenDailyRepository extends JpaRepository<GlobalSavedTokenDaily, LocalDateTime> {
    // 특정 window_start 기준 조회
    GlobalSavedTokenDaily findByWindowStart(LocalDateTime windowStart);
}
