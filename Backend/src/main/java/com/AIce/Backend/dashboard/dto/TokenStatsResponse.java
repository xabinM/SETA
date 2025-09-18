package com.AIce.Backend.dashboard.dto;

import com.AIce.Backend.domain.dashboard.entity.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenStatsResponse {
    private LocalDate window;
    private UserSavedTokenTotal userTotal;
    private GlobalSavedTokenTotal globalTotal;

}