package com.AIce.Backend.chat.controller;

import com.AIce.Backend.chat.dto.ChatMessageResponse;
import com.AIce.Backend.chat.dto.ChatRoomResponse;
import com.AIce.Backend.chat.service.ChatRoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomController {
    private final ChatRoomService chatRoomService;

    @GetMapping
    @Operation(summary="채팅방 목록 조회")
    public List<ChatRoomResponse> listMyRooms(@AuthenticationPrincipal Long userId) {
        return chatRoomService.listMyRooms(userId);
    }

    @PostMapping
    @Operation(summary="채팅방 생성")
    public ChatRoomResponse create(@AuthenticationPrincipal Long userId) {
        return chatRoomService.createRoom(userId);
    }

    @DeleteMapping("/{roomId}")
    @Operation(summary="채팅방 삭제")
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable UUID roomId) {
        chatRoomService.deleteRoom(userId, roomId);
    }

    @GetMapping("/{roomId}/messages")
    @Operation(summary="채팅방 내 메시지 히스토리 조회")
    public List<ChatMessageResponse> listMyRooms(@AuthenticationPrincipal Long userId, @PathVariable UUID roomId) {
        return chatRoomService.listMyMessages(userId, roomId);
    }
}