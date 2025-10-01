package com.AIce.Backend.chat.contracts;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LlmResponseV1 {
    private HeadersV1 headers;
    private String trace_id;
    private String room_id;
    private String message_id;
    private Long timestamp;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Llm {
        private String model;
        private Double temperature;
    }
    private Llm llm;

    private Long latency_ms;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private String text;
    }
    private Response response;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TokenUsage {
        private Integer input;
        private Integer output;
        private Integer total;
    }
    private TokenUsage token_usage;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CostEstimate {
        private String currency;
        private Double value;
    }
    private CostEstimate cost_estimate;

    private String schema_version;
}
