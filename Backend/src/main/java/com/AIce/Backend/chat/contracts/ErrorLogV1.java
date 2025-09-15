package com.AIce.Backend.chat.contracts;

import lombok.Data;
import java.util.Map;

@Data
public class ErrorLogV1 {
    private HeadersV1 headers;
    private String trace_id;
    private String room_id;
    private Long timestamp;
    private String component;
    private String level; // ERROR | WARN | ...
    @Data public static class Error {
        private String type;
        private String message;
        private String stack; // nullable
    }
    private Error error;
    private Map<String, Object> context;
    private String schema_version;
}

