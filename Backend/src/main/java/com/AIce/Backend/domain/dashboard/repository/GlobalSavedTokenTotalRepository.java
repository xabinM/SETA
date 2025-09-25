package com.AIce.Backend.domain.dashboard.repository;

import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenTotal;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenTotal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface GlobalSavedTokenTotalRepository extends JpaRepository<GlobalSavedTokenTotal, OffsetDateTime> {
    Optional<GlobalSavedTokenTotal> findTopByOrderByStatDateDesc();
}
