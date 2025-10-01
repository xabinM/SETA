package com.AIce.Backend.chat.service;

import com.AIce.Backend.global.sse.SseHub;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HeartbeatScheduler {

    private final SseHub hub;

    // 25초마다 모든 활성 연결에 heartbeat 전송
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        hub.getActiveConnections().forEach((roomId, count) -> {
            hub.sendHeartbeat(roomId);
        });
    }
}