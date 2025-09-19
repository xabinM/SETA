package com.AIce.Backend.chat.controller;

import com.AIce.Backend.chat.dto.SendMessageRequest;
import com.AIce.Backend.chat.dto.SendMessageResponse;
import com.AIce.Backend.chat.service.ChatMessageService;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/rooms")
public class ChatMessageController {

    private final Tracer tracer;
    private final ChatMessageService chatMessageService;

    @Observed(name = "chat.postMessage")
    @Operation(summary = "메시지 입력")
    @PostMapping("/{roomId}/messages")
    public ResponseEntity<SendMessageResponse> postMessage(
            @AuthenticationPrincipal Long userId,
            @PathVariable String roomId,
            @RequestBody SendMessageRequest req,
            HttpServletResponse resp
    ) {
        // 1) 현재 스팬 traceId
        String traceId = tracer.currentSpan().context().traceId();
        chatMessageService.handleUserMessage(
                roomId,
                userId,
                req.getText()
        );
        return ResponseEntity.ok(new SendMessageResponse(traceId));
    }
}