package com.AIce.Backend.domain.dashboard.repository;

import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenTotal;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenTotalId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.*;

public interface UserSavedTokenTotalRepository extends JpaRepository<UserSavedTokenTotal, UserSavedTokenTotalId> {

    // 특정 userId + 날짜 기준 조회
    Optional<UserSavedTokenTotal> findByUserIdAndStatDate(String userId, LocalDate statDate);

    // 특정 userId의 모든 total 기록
    List<UserSavedTokenTotal> findByUserId(String userId);

    // 가장 최근 통계
    Optional<UserSavedTokenTotal> findTopByUserIdOrderByStatDateDesc(String userId);
}