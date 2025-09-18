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
public class UserSavedTokenDailyDto {
    private String userId;
    private LocalDateTime windowStartKst;
    private Long requestCount;
    private Long savedTokens;
    private Long tokenSum;
    private BigDecimal costSumUsd;

    public static UserSavedTokenDailyDto from(UserSavedTokenDaily entity) {
        LocalDateTime kst = entity.getWindowStart()
                .atZone(ZoneOffset.UTC)
                .withZoneSameInstant(ZoneId.of("Asia/Seoul"))
                .toLocalDateTime();

        return UserSavedTokenDailyDto.builder()
                .userId(entity.getUserId())
                .windowStartKst(kst)
                .requestCount(entity.getRequestCount())
                .savedTokens(entity.getSavedTokens())
                .tokenSum(entity.getTokenSum())
                .costSumUsd(entity.getCostSumUsd())
                .build();
    }
}
