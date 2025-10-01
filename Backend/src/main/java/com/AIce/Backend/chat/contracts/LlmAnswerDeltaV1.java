package com.AIce.Backend.chat.contracts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmAnswerDeltaV1 {
    private String trace_id;
    private String message_id;
    private String room_id;
    private String delta;
    private Long timestamp;

    public LocalDateTime getTimestampKST() {
        if (timestamp == null) return null;
        return LocalDateTime.ofInstant(
                Instant.ofEpochMilli(timestamp),
                ZoneId.of("Asia/Seoul")
        );
    }
}
