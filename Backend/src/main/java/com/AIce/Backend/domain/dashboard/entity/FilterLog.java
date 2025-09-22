package com.AIce.Backend.domain.dashboard.entity;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterLog {

    private String traceId;
    private String userId;
    private String droppedText;
    private String reasonType;
    private OffsetDateTime createdAt;
}
