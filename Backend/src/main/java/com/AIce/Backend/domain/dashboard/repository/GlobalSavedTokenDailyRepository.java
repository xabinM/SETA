package com.AIce.Backend.domain.dashboard.repository;

import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenDaily;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.*;
import java.util.Optional;

public interface GlobalSavedTokenDailyRepository extends JpaRepository<GlobalSavedTokenDaily, OffsetDateTime> {
    Optional<GlobalSavedTokenDaily> findTopByOrderByWindowStartDesc();
}
