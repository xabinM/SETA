package com.AIce.Backend.chat.controller;

import com.AIce.Backend.chat.dto.SendMessageReq;
import com.AIce.Backend.chat.service.ChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/rooms")
public class ChatController {

    private final ChatService chatService;

    @Tag(name="메세지 입력")
    @PostMapping("/{roomId}/messages")
    public ResponseEntity<?> postMessage(@PathVariable String roomId,
                                         @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                                         @RequestHeader(value = "User-Agent", required = false) String userAgent,
                                         @RequestBody SendMessageReq req) {
        // 멱등성 처리는 Redis/DB로 확장 (여긴 생략)
        UUID messageId = chatService.handleUserMessage(
                roomId, req.getUserId(), req.getText(), req.getSessionId(), req.getTraceId(), userAgent
        );
        return ResponseEntity.accepted().body(Map.of(
                "traceId", req.getTraceId(),
                "messageId", messageId.toString()));
    }
}