package com.AIce.Backend.dashboard.dto;

import com.AIce.Backend.domain.dashboard.entity.*;
import lombok.*;

import java.util.List;

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
    private List<TopDroppedTextDto> topDroppedTexts;
    private List<TopReasonDto> topReasons;

    // === 변환 메서드 ===
    public static TokenStatsResponse from(
            UserSavedTokenTotal userTotal,
            UserSavedTokenDaily userDaily,
            GlobalSavedTokenDaily globalDaily,
            GlobalSavedTokenTotal globalTotal,
            List<TopDroppedTextDto> topDroppedTexts,
            List<TopReasonDto> topReasons
    ) {
        return TokenStatsResponse.builder()
                .userTotal(userTotal)
                .userDaily(userDaily != null ? UserSavedTokenDailyDto.from(userDaily) : null)
                .globalDaily(globalDaily != null ? GlobalSavedTokenDailyDto.from(globalDaily) : null)
                .globalTotal(globalTotal)
                .topDroppedTexts(topDroppedTexts)
                .topReasons(topReasons)
                .build();
    }
}