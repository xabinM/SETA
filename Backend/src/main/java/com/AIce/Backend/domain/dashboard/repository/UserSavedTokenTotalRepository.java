package com.AIce.Backend.domain.dashboard.repository;

import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenTotal;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenTotalId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.*;

public interface UserSavedTokenTotalRepository extends JpaRepository<UserSavedTokenTotal, UserSavedTokenTotalId> {
    Optional<UserSavedTokenTotal> findTopByUserIdOrderByStatDateDesc(String userId);
}