package com.AIce.Backend.domain.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_saved_token_daily")
@IdClass(UserSavedTokenDailyId.class)
public class UserSavedTokenDaily {
    @Id
    private String userId;

    @Id
    private LocalDateTime windowStart;

    private Long requestCount;
    private Long savedTokens;
    private Long tokenSum;

    @Column(precision = 14, scale = 6)
    private BigDecimal costSumUsd;
}