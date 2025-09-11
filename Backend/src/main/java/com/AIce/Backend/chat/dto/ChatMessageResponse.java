package com.AIce.Backend.chat.dto;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import com.AIce.Backend.global.enums.ChatMessageRole;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ChatMessageResponse {
    private UUID messageId;
    private ChatMessageRole role;
    private String content;
    private String filteredContent;
    private LocalDateTime createdAt;
    private Integer turnIndex;

    public static ChatMessageResponse from(ChatMessage m) {
        return new ChatMessageResponse(
                m.getMessageId(),
                m.getRole(),
                m.getContent(),
                m.getFilteredContent(),
                m.getCreatedAt(),
                m.getTurnIndex()
        );
    }
}
