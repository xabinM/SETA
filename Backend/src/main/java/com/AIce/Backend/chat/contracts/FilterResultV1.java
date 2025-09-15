package com.AIce.Backend.chat.contracts;

import lombok.Data;

import java.util.List;

@Data
public class FilterResultV1 {
    private HeadersV1 headers;
    private String trace_id;
    private String room_id;
    private String message_id;
    private String stage;        // "filler_removal" | "intent_classifier"
    private Integer stage_order;
    private Long timestamp;
    private String original_text;
    private String cleaned_text;

    // step1
    private List<String> detected_phrases;

    // step2
    @Data public static class Decision {
        private String action;   // PASS | DROP
        private Double score;
        private Double threshold;
        private String reason_type;
        private String reason_text;
    }
    private Decision decision;
    private List<String> explanations;

    private String schema_version;
}