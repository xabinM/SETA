package com.AIce.Backend.usersetting.dto;

import com.AIce.Backend.global.enums.PreferredTone;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSettingResponse {
    private UUID userSettingId;
    private Long userId;
    private String callMe;
    private String roleDescription;
    private PreferredTone preferredTone;
    private String traits;
    private String additionalContext;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
