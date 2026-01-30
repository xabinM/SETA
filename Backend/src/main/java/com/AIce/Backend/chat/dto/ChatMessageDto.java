package com.AIce.Backend.chat.dto;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import com.AIce.Backend.global.enums.ChatMessageRole;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ChatMessageDto {
    private UUID messageId;
    private String content;
    private ChatMessageRole role;
    private LocalDateTime createdAt;
    private Long authorId;
    private UUID chatRoomId;

    public ChatMessageDto(ChatMessage entity) {
        this.messageId = entity.getMessageId();
        this.content = entity.getContent();
        this.role = entity.getRole();
        this.createdAt = entity.getCreatedAt();
        this.authorId = entity.getUser().getUserId();
        this.chatRoomId = entity.getChatRoom().getChatRoomId();
    }
}
