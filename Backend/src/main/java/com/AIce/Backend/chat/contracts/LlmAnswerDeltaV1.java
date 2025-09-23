package com.AIce.Backend.chat.contracts;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmAnswerDeltaV1 {
    private String trace_id;
    private String message_id;
    private String room_id;
    private Content content;
    private String status;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Content {
        private String delta;
        private int index;
    }
}
