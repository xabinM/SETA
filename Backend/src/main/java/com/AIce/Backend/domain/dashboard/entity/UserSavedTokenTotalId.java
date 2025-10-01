package com.AIce.Backend.domain.dashboard.entity;

import lombok.*;
import java.io.Serializable;
import java.time.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserSavedTokenTotalId implements Serializable {
    private String userId;
    private OffsetDateTime statDate;
}
