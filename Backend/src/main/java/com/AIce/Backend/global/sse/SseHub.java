package com.AIce.Backend.global.sse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// roomId별 구독자 관리, broadcast Hub
@Component
public class SseHub {
    private final Map<String, List<SseEmitter>> byRoom = new ConcurrentHashMap<>();

    // room 구독자 등록
    public SseEmitter subscribe(String roomId) {
        SseEmitter emitter = new SseEmitter(Duration.ofMinutes(30).toMillis());
        byRoom.computeIfAbsent(roomId, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(emitter);

        // 완료/타임아웃 시 자동 제거
        emitter.onCompletion(() -> remove(roomId, emitter));
        emitter.onTimeout(() -> remove(roomId, emitter));

        // 연결 유지용 핑
        push(roomId, "ping", "ok");
        return emitter;
    }

    // 해당 room 구독자에게 SSE 전송
    public void push(String roomId, String eventName, Object payload) {
        var list = byRoom.getOrDefault(roomId, List.of());
        var dead = new ArrayList<SseEmitter>();
        synchronized (list) {
            for (SseEmitter e : list) {
                try {
                    e.send(SseEmitter.event().name(eventName).data(payload));
                } catch (IOException ex) {
                    dead.add(e);
                }
            }
            list.removeAll(dead);
        }
    }

    // 구독 해제
    private void remove(String roomId, SseEmitter e) {
        var list = byRoom.get(roomId);
        if (list != null) list.remove(e);
    }
}