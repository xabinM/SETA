package com.AIce.Backend.dashboard.service;

import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenTotal;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenTotal;
import com.AIce.Backend.domain.dashboard.repository.GlobalSavedTokenDailyRepository;
import com.AIce.Backend.domain.dashboard.repository.GlobalSavedTokenTotalRepository;
import com.AIce.Backend.domain.dashboard.repository.UserSavedTokenDailyRepository;
import com.AIce.Backend.domain.dashboard.repository.UserSavedTokenTotalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TokenStatsService {

    private final UserSavedTokenDailyRepository userSavedTokenDailyRepository;
    private final GlobalSavedTokenDailyRepository globalSavedTokenDailyRepository;
    private final UserSavedTokenTotalRepository userSavedTokenTotalRepository;
    private final GlobalSavedTokenTotalRepository globalSavedTokenTotalRepository;

    // 로그인한 유저의 특정 날짜 daily 통계
    public UserSavedTokenTotal getUserStatsByDate(Long userId, LocalDate today) {
        return userSavedTokenTotalRepository.findByUserIdAndStatDate(userId.toString(), today)
                .orElse(null);
    }

    // 로그인한 유저의 total 통계
    public List<UserSavedTokenTotal> getUserStatsByUserId(Long userId) {
        return userSavedTokenTotalRepository.findByUserId(userId.toString());
    }

    // 특정 날짜 글로벌 daily
    public GlobalSavedTokenTotal getGlobalTotalByDate(LocalDate date) {
        return globalSavedTokenTotalRepository.findByStatDate(date)
                .orElse(null);
    }

    // 글로벌 total
    public List<GlobalSavedTokenTotal> getGlobalTotal() {
        return globalSavedTokenTotalRepository.findAll();
    }
}
