package com.AIce.Backend.service;

import com.AIce.Backend.dashboard.service.TokenStatsService;
import com.AIce.Backend.domain.dashboard.entity.*;
import com.AIce.Backend.domain.dashboard.repository.GlobalSavedTokenDailyRepository;
import com.AIce.Backend.domain.dashboard.repository.GlobalSavedTokenTotalRepository;
import com.AIce.Backend.domain.dashboard.repository.UserSavedTokenDailyRepository;
import com.AIce.Backend.domain.dashboard.repository.UserSavedTokenTotalRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class TokenStatsServiceTest {

    @Autowired
    private TokenStatsService tokenStatsService;

    @Autowired
    private UserSavedTokenDailyRepository dailyRepo;

    @Autowired
    private UserSavedTokenTotalRepository totalRepo;

    @Autowired
    private GlobalSavedTokenDailyRepository globalDailyRepo;

    @Autowired
    private GlobalSavedTokenTotalRepository globalTotalRepo;

    @Test
    @DisplayName("유저 최신 Daily 통계 조회 성공")
    void getUserDaily_success() {
        UserSavedTokenDaily daily = new UserSavedTokenDaily();
        daily.setUserId("1");
        daily.setWindowStart(LocalDateTime.now());
        daily.setSavedTokens(100L);
        daily.setRequestCount(5L);
        daily.setTokenSum(200L);

        dailyRepo.save(daily);

        UserSavedTokenDaily result = tokenStatsService.getUserDaily(1L);

        assertNotNull(result);
        assertEquals(100L, result.getSavedTokens());
    }

    @Test
    @DisplayName("유저 최신 Daily 통계 없음 → null 반환")
    void getUserDaily_empty() {
        UserSavedTokenDaily result = tokenStatsService.getUserDaily(99L);
        assertNull(result);
    }

    @Test
    @DisplayName("유저 최신 Total 통계 조회 성공")
    void getUserTotal_success() {
        UserSavedTokenTotal entity = new UserSavedTokenTotal();
        entity.setUserId("1");                       // PK 필수
        entity.setStatDate(LocalDate.now());         // PK 필수
        entity.setSavedTokens(500L);
        entity.setRequestCount(10L);
        entity.setTokenSum(600L);
        entity.setCostSumUsd(BigDecimal.valueOf(1.25));

        totalRepo.save(entity);

        UserSavedTokenTotal result = tokenStatsService.getUserTotal(1L);

        assertNotNull(result);
        assertEquals(500L, result.getSavedTokens());
    }

    @Test
    @DisplayName("글로벌 최신 Daily 통계 조회 성공")
    void getGlobalDaily_success() {
        GlobalSavedTokenDaily daily = new GlobalSavedTokenDaily();
        daily.setWindowStart(OffsetDateTime.now());   // PK
        daily.setSavedTokens(3000L);
        daily.setRequestCount(100L);
        daily.setTokenSum(5000L);

        globalDailyRepo.save(daily);

        GlobalSavedTokenDaily result = tokenStatsService.getGlobalDaily();

        assertNotNull(result);
        assertEquals(3000L, result.getSavedTokens());
    }

    @Test
    @DisplayName("글로벌 최신 Total 통계 조회 성공")
    void getGlobalTotal_success() {
        GlobalSavedTokenTotal total = new GlobalSavedTokenTotal();
        total.setStatDate(LocalDate.now());          // PK
        total.setSavedTokens(15000L);
        total.setRequestCount(500L);
        total.setTokenSum(20000L);

        globalTotalRepo.save(total);

        GlobalSavedTokenTotal result = tokenStatsService.getGlobalTotal();

        assertNotNull(result);
        assertEquals(15000L, result.getSavedTokens());
    }
}