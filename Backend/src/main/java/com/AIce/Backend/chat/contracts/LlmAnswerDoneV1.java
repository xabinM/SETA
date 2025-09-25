package com.AIce.Backend.chat.contracts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmAnswerDoneV1 {
    private String trace_id;
    private String message_id;
    private String room_id;
    private Response response;
    private Usage usage;
    private Long latency_ms;
    private String schema_version;
    private Long timestamp;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Usage {
        private int prompt_tokens;
        private int completion_tokens;
        private int total_tokens;
    }

    public LocalDateTime getTimestampKST() {
        if (timestamp == null) return null;
        return LocalDateTime.ofInstant(
                Instant.ofEpochMilli(timestamp),
                ZoneId.of("Asia/Seoul")
        );
    }
}
