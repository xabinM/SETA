package com.AIce.Backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class SendMessageResponse {
    private String traceId;
}
