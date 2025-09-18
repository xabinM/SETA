package com.AIce.Backend.domain.dashboard.repository;

import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenTotal;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenTotal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface GlobalSavedTokenTotalRepository extends JpaRepository<GlobalSavedTokenTotal, LocalDate> {
    // 특정 날짜 글로벌 통계
    Optional<GlobalSavedTokenTotal> findByStatDate(LocalDate statDate);

    // 글로벌 통계
    List<GlobalSavedTokenTotal> findAll();
}
