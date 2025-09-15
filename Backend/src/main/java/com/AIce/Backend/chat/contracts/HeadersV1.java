package com.AIce.Backend.chat.contracts;

import lombok.Data;

// 공통 헤더
@Data
public class HeadersV1 {
    private String trace_id;
    private String schema_version;
    private String producer;         // "gateway"|"filter-service"|"llm-worker"
    private Long created_at_ms;      // epoch ms
    private String content_type;     // "application/json"
}