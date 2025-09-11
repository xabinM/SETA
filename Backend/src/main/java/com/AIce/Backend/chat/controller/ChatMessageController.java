package com.AIce.Backend.chat.controller;

import com.AIce.Backend.chat.dto.SendMessageRequest;
import com.AIce.Backend.chat.dto.SendMessageResponse;
import com.AIce.Backend.chat.service.ChatMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat/rooms")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    @Operation(summary = "메시지 입력")
    @PostMapping("/{roomId}/messages")
    public ResponseEntity<SendMessageResponse> postMessage(
            @AuthenticationPrincipal Long userId,
            @PathVariable String roomId,
            @RequestBody SendMessageRequest req
    ) {
        String traceId = chatMessageService.handleUserMessage(
                roomId,
                userId,
                req.getText()
        );
        return ResponseEntity.ok(new SendMessageResponse(traceId));
    }
}