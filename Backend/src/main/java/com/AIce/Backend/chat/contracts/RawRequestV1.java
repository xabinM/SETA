package com.AIce.Backend.chat.contracts;

import lombok.Data;

@Data
public class RawRequestV1 {
    private HeadersV1 headers;
    private String trace_id;
    private String room_id;
    private String message_id;
    private String user_id;
    private Long timestamp;
    private String text;
    private String schema_version; // duplicate for convenience
}
