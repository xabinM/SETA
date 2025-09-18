package com.AIce.Backend.dashboard.service;

import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenDaily;
import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenTotal;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenDaily;
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

    // 로그인한 유저의 최신 daily 통계
    public UserSavedTokenDaily getUserDaily(Long userId) {
        return userSavedTokenDailyRepository
                .findTopByUserIdOrderByWindowStartDesc(userId.toString())
                .orElse(null);
    }

    // 로그인한 유저의 최신 total 통계
    public UserSavedTokenTotal getUserTotal(Long userId) {
        return userSavedTokenTotalRepository
                .findTopByUserIdOrderByStatDateDesc(userId.toString())
                .orElse(null);
    }

    // 최신 글로벌 daily
    public GlobalSavedTokenDaily getGlobalDaily() {
        return globalSavedTokenDailyRepository
                .findTopByOrderByWindowStartDesc()
                .orElse(null);
    }

    // 최신 글로벌 total
    public GlobalSavedTokenTotal getGlobalTotal() {
        return globalSavedTokenTotalRepository
                .findTopByOrderByStatDateDesc()
                .orElse(null);
    }
}
