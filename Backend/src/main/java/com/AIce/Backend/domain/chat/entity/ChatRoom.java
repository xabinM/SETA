package com.AIce.Backend.domain.chat.entity;

import com.AIce.Backend.domain.common.BaseTimeEntity;
import com.AIce.Backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "chat_room",
        indexes = {
                @Index(name = "idx_chat_room_owner", columnList = "owner_id")
        }
)
public class ChatRoom extends BaseTimeEntity {
    @Id
    @UuidGenerator
    @Column(name = "chat_room_id", columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID chatRoomId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User user;

    @Column(length = 255)
    private String title;
}
