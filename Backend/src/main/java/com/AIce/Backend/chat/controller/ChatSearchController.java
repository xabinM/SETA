package com.AIce.Backend.chat.controller;

import com.AIce.Backend.chat.dto.ChatMessageDto;
import com.AIce.Backend.chat.service.ChatSearchService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/search")
public class ChatSearchController {

    private final ChatSearchService chatSearchService;

    @Operation(summary = "채팅 내용 검색 (LIKE) - 로컬 테스트용")
    @GetMapping("/like")
    public ResponseEntity<List<ChatMessageDto>> searchLike(@RequestParam String keyword) {
        return ResponseEntity.ok(chatSearchService.searchByLike(keyword));
    }

    @Operation(summary = "채팅 내용 검색 (FTS) - 로컬 테스트용")
    @GetMapping("/fts")
    public ResponseEntity<List<ChatMessageDto>> searchFts(@RequestParam String keyword) {
        return ResponseEntity.ok(chatSearchService.searchByFts(keyword));
    }
}
