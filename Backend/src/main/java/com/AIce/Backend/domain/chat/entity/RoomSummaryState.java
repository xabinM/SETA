package com.AIce.Backend.domain.chat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "room_summary_state")
public class RoomSummaryState {
    @Id
    @Column(name = "chat_room_id", nullable = false)
    private UUID chatRoomId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @Column(name = "last_turn_end", nullable = false)
    private int lastTurnEnd;

    @Column(name = "last_summary_at")
    private LocalDateTime lastSummaryAt;
}
