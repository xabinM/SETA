package com.AIce.Backend.chat.dto;

import com.AIce.Backend.domain.chat.entity.ChatRoom;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class ChatRoomResponse {
    private UUID chatRoomId;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ChatRoomResponse(ChatRoom room) {
        this.chatRoomId = room.getChatRoomId();
        this.title = room.getTitle();
        this.createdAt = room.getCreatedAt();
        this.updatedAt = room.getUpdatedAt();
    }

    public static ChatRoomResponse from(ChatRoom room) {
        return new ChatRoomResponse(
                room.getChatRoomId(),
                room.getTitle(),
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }
}
