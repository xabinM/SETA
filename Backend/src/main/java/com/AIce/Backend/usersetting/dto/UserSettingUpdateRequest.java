package com.AIce.Backend.usersetting.dto;

import com.AIce.Backend.global.enums.PreferredTone;
import lombok.*;
import jakarta.validation.constraints.Size;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSettingUpdateRequest {
    @Size(max = 64)
    private String callMe;
    private String roleDescription;
    private PreferredTone preferredTone;
    private String traits;
    private String additionalContext;
}
