package com.AIce.Backend.domain.chat.entity;

import com.AIce.Backend.domain.user.entity.User;
import com.AIce.Backend.global.enums.ChatMessageRole;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "chat_message",
        indexes = {
                @Index(name = "idx_chat_message_room", columnList = "chat_room_id"),
                @Index(name = "idx_chat_message_author", columnList = "author_id")
        }
)
public class ChatMessage {
    @Id
    @UuidGenerator
    @Column(name = "message_id", columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID messageId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 16)
    private ChatMessageRole role;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "filtered_content", columnDefinition = "TEXT")
    private String filteredContent;

    @Column(name = "external_id", length = 64)
    private String externalId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "timestamptz")
    private LocalDateTime createdAt;

    @Column(name = "turn_index")
    private Integer turnIndex;
}
