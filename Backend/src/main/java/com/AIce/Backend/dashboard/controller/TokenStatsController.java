package com.AIce.Backend.dashboard.controller;

import com.AIce.Backend.dashboard.dto.TokenStatsResponse;
import com.AIce.Backend.dashboard.service.TokenStatsService;
import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenDaily;
import com.AIce.Backend.domain.dashboard.entity.GlobalSavedTokenTotal;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenDaily;
import com.AIce.Backend.domain.dashboard.entity.UserSavedTokenTotal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/dashboard/kpi")
@RequiredArgsConstructor
public class TokenStatsController {

    private final TokenStatsService tokenStatsService;

    @GetMapping
    @Operation(summary = "대시보드 KPI 조회", description = "로그인한 유저와 전체 유저의 Daily/Total 통계를 반환")
    public Object getStats(@AuthenticationPrincipal Long userId) {
        return TokenStatsResponse.from(
                tokenStatsService.getUserTotal(userId),
                tokenStatsService.getUserDaily(userId),
                tokenStatsService.getGlobalDaily(),
                tokenStatsService.getGlobalTotal()
                );
    }
}
