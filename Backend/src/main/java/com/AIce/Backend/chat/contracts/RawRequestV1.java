package com.AIce.Backend.chat.contracts;

import lombok.Data;

@Data
public class RawRequestV1 {
    private HeadersV1 headers;
    private String room_id;
    private String message_id;
    private String session_id;
    private String user_id;
    private Long timestamp;
    private String text;
    private String channel;
    private String user_agent;
    private String schema_version; // duplicate for convenience
}
