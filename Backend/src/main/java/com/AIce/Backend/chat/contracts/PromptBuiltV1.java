package com.AIce.Backend.chat.contracts;

import lombok.Data;

import java.util.List;

@Data
public class PromptBuiltV1 {
    private HeadersV1 headers;
    private String trace_id;
    private String room_id;
    private String message_id;
    private Long timestamp;

    @Data public static class Prompt {
        private String system;
        private List<String> context_snippets;
        private String user_input;
        private String full_prompt;
    }
    private Prompt prompt;

    @Data public static class TokenUsageEstimate {
        private Integer input_tokens;
    }
    private TokenUsageEstimate token_usage_estimate;

    private String schema_version;
}