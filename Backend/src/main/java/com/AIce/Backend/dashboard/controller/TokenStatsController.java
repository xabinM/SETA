package com.AIce.Backend.dashboard.controller;

import com.AIce.Backend.dashboard.dto.TokenStatsResponse;
import com.AIce.Backend.dashboard.service.TokenStatsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/dashboard/kpi")
@RequiredArgsConstructor
public class TokenStatsController {

    private final TokenStatsService tokenStatsService;

    @GetMapping
    @Operation(summary = "대시보드 KPI 조회", description = "로그인한 유저와 전체 유저의 Daily/Total 통계를 반환")
    public Object getStats(@AuthenticationPrincipal Long userId) throws IOException {
        return TokenStatsResponse.from(
                tokenStatsService.getUserTotal(userId),
                tokenStatsService.getUserDaily(userId),
                tokenStatsService.getGlobalDaily(),
                tokenStatsService.getGlobalTotal(),
                tokenStatsService.getTopDroppedTexts(userId),
                tokenStatsService.getTopReasons()
                );
    }
}
