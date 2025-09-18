package com.AIce.Backend.dashboard.dto;

import com.AIce.Backend.domain.dashboard.entity.*;
import lombok.*;

import java.time.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenStatsResponse {

    private UserSavedTokenTotal userTotal;
    private UserSavedTokenDailyDto userDaily;
    private GlobalSavedTokenDailyDto globalDaily;
    private GlobalSavedTokenTotal globalTotal;

    // === 변환 메서드 ===
    public static TokenStatsResponse from(
            UserSavedTokenTotal userTotal,
            UserSavedTokenDaily userDaily,
            GlobalSavedTokenDaily globalDaily,
            GlobalSavedTokenTotal globalTotal
    ) {
        return TokenStatsResponse.builder()
                .userTotal(userTotal)
                .userDaily(userDaily != null ? UserSavedTokenDailyDto.from(userDaily) : null)
                .globalDaily(globalDaily != null ? GlobalSavedTokenDailyDto.from(globalDaily) : null)
                .globalTotal(globalTotal)
                .build();
    }
}