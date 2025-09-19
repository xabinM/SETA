package com.AIce.Backend.global.sse;

import com.AIce.Backend.chat.service.ChatRoomService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/sse")
public class SseController {
    private final SseHub hub;
    private final ChatRoomService chatRoomService;

    @Operation(summary="실시간 응답 스트리밍")
    @GetMapping(value = "/chat/{roomId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> subscribe(@PathVariable String roomId, @AuthenticationPrincipal Long userId) {

        if (!chatRoomService.hasAccessToRoom(userId, roomId)) {
            log.warn("SSE 접근 권한 없음 - userId: {}, roomId: {}", userId, roomId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
       }

        SseEmitter emitter = hub.subscribe(roomId);

        HttpHeaders h = new HttpHeaders();
        h.set(HttpHeaders.CACHE_CONTROL, "no-cache");
        h.set("X-Accel-Buffering", "no");     // Nginx 버퍼링 비활성
        h.set(HttpHeaders.CONNECTION, "keep-alive");

        return ResponseEntity.ok().headers(h).body(emitter);
    }
}