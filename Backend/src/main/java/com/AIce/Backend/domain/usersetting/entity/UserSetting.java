package com.AIce.Backend.domain.usersetting.entity;

import com.AIce.Backend.domain.common.BaseTimeEntity;
import com.AIce.Backend.domain.user.entity.User;
import com.AIce.Backend.global.enums.PreferredTone;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "user_setting")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSetting extends BaseTimeEntity {
    @Id
    @UuidGenerator
    @Column(name = "user_setting_id", columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID userSettingId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    @Column(name = "call_me", length = 64)
    private String callMe;

    @Column(name = "role_description", columnDefinition = "text")
    private String roleDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_tone")
    private PreferredTone preferredTone;

    @Column(name = "traits", columnDefinition = "text")
    private String traits;

    @Column(name = "additional_context", columnDefinition = "text")
    private String additionalContext;
}
