package com.AIce.Backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SendMessageReq {
    private Long userId;
    private String text;
    private String sessionId;
    private String traceId;
}
