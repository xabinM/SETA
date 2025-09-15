package com.AIce.Backend.global.dto;

import java.util.List;

@lombok.Getter
public class ChatCompletionResponse {
    private List<Choice> choices;
    @lombok.Getter public static class Choice { private Message message; }
    @lombok.Getter public static class Message { private String role; private String content; }
}
