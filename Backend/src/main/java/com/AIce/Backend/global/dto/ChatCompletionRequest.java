package com.AIce.Backend.global.dto;

import java.util.List;

@lombok.Builder @lombok.Getter
public class ChatCompletionRequest {
    private String model;
    private List<Message> messages;

    @lombok.Builder @lombok.Getter
    public static class Message {
        private String role;
        private String content;
    }
}

