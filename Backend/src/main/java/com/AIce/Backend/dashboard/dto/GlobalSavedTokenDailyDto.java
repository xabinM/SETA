package com.AIce.Backend.dashboard.dto;

import com.AIce.Backend.domain.dashboard.entity.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalSavedTokenDailyDto {
    private LocalDateTime windowStartKst;
    private Long requestCount;
    private Long savedTokens;
    private Long tokenSum;
    private BigDecimal costSumUsd;

    public static GlobalSavedTokenDailyDto from(GlobalSavedTokenDaily entity) {
        LocalDateTime kst = entity.getWindowStart()
                .atZoneSameInstant(ZoneOffset.UTC)
                .withZoneSameInstant(ZoneId.of("Asia/Seoul"))
                .toLocalDateTime();

        return GlobalSavedTokenDailyDto.builder()
                .windowStartKst(kst)
                .requestCount(entity.getRequestCount())
                .savedTokens(entity.getSavedTokens())
                .tokenSum(entity.getTokenSum())
                .costSumUsd(entity.getCostSumUsd())
                .build();
    }
}

