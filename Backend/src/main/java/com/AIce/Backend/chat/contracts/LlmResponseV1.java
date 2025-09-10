package com.AIce.Backend.chat.contracts;

import lombok.Data;

@Data
public class LlmResponseV1 {
    private HeadersV1 headers;
    private String trace_id;
    private String room_id;
    private String message_id;
    private Long timestamp;

    @Data public static class Llm {
        private String model;
        private Double temperature;
    }
    private Llm llm;
    private Long latency_ms;

    @Data public static class Response {
        private String text;
    }
    private Response response;

    @Data public static class TokenUsage {
        private Integer input;
        private Integer output;
        private Integer total;
    }
    private TokenUsage token_usage;

    @Data public static class CostEstimate {
        private String currency;
        private Double value;
    }
    private CostEstimate cost_estimate;

    private String schema_version;
}
