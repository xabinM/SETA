package com.AIce.Backend.chat.service;

import com.AIce.Backend.chat.client.TitleSummarizerClient;
import com.AIce.Backend.domain.chat.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRoomTitleService {
    private final TitleSummarizerClient summarizer;
    private final ChatRoomRepository chatRoomRepository;

    // 동일 roomId 중복 실행 방지
    private final ConcurrentMap<UUID, Boolean> inFlight = new ConcurrentHashMap<>();

    @Async("titleUpdateExecutor")
    public void tryUpdateTitleAsync(UUID roomId, String firstUserMessage) {
        log.info("[TitleUpdate] start roomId={} thread={}", roomId, Thread.currentThread().getName());

        if (inFlight.putIfAbsent(roomId, true) != null) {
            log.debug("[TitleUpdate] already in-flight roomId={}", roomId);
            return;
        }

        Mono<String> titleMono = summarizer.summarizeToTitleAsync(firstUserMessage)
                .onErrorResume(e -> {
                    log.warn("[TitleUpdate] summarizer failed, using fallback. msg={} cause={}", firstUserMessage, e.toString());
                    return Mono.just(fallback(firstUserMessage));
                })
                .map(title -> (title == null || title.isBlank()) ? fallback(firstUserMessage) : title);

        titleMono.subscribe(title -> {
            try {
                chatRoomRepository.findById(roomId).ifPresent(room -> {
                    room.setTitle(title);
                    chatRoomRepository.save(room);
                    log.info("[TitleUpdate] roomId={} title='{}'", roomId, title);
                });
            } finally {
                inFlight.remove(roomId);
                log.debug("[TitleUpdate] finish roomId={}", roomId);
            }
        });
    }

    private String fallback(String msg) {
        if (msg == null)
            return "New Chat";
        String first = msg.split("\\R", 2)[0]
                .replaceAll("[\\[\\](){}\"'`<>]", " ")
                .replaceAll("\\s+", " ").trim();
        if (first.isBlank())
            return "New Chat";
        return first.length() <= 18 ? first : first.substring(0, 18);
    }
}
