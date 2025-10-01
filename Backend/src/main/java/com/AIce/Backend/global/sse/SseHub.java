package com.AIce.Backend.global.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class SseHub {
    private final Map<String, List<SseEmitter>> byRoom = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String roomId) {
        SseEmitter emitter = new SseEmitter(0L); // 무제한 유지

        // 룸별 구독자 리스트에 추가
        byRoom.computeIfAbsent(roomId, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(emitter);
        log.info("SSE 구독 시작 - roomId: {}, 현재 구독자 수: {}", roomId, byRoom.get(roomId).size());

        // 완료/타임아웃/에러 시 자동 제거
        emitter.onCompletion(() -> {
            log.info("SSE 연결 완료 - roomId: {}", roomId);
            remove(roomId, emitter);
        });

        emitter.onTimeout(() -> {
            log.warn("SSE 연결 타임아웃 - roomId: {}", roomId);
            remove(roomId, emitter);
        });

        emitter.onError((throwable) -> {
            log.error("SSE 연결 에러 - roomId: {}, error: {}", roomId, throwable.getMessage());
            remove(roomId, emitter);
        });

        // 구독 직후 연결 확인 메시지
        sendSafely(emitter, "connected", "Successfully connected to room: " + roomId,
                "connect-" + System.currentTimeMillis());

        return emitter;
    }

    // 해당 room 구독자에게 SSE 전송
    public void push(String roomId, String eventName, Object payload) {
        var list = byRoom.get(roomId);
        if (list == null || list.isEmpty()) {
            log.debug("푸시할 구독자가 없음 - roomId: {}", roomId);
            return;
        }

        var deadEmitters = new ArrayList<SseEmitter>();
        int successCount = 0;
        int failCount = 0;

        synchronized (list) {
            for (var emitter : list) {
                boolean success = sendSafely(emitter, eventName, payload, null);
                if (success) {
                    successCount++;
                } else {
                    failCount++;
                    deadEmitters.add(emitter);
                }
            }

            // 실패한 연결들 제거
            if (!deadEmitters.isEmpty()) {
                list.removeAll(deadEmitters);
                log.info("죽은 SSE 연결 제거 - roomId: {}, 제거된 수: {}", roomId, deadEmitters.size());
            }
        }

        log.debug("SSE 메시지 전송 완료 - roomId: {}, 성공: {}, 실패: {}, 이벤트: {}",
                roomId, successCount, failCount, eventName);
    }

    // 안전한 메시지 전송
    private boolean sendSafely(SseEmitter emitter, String eventName, Object data, String id) {
        try {
            SseEmitter.SseEventBuilder eventBuilder = SseEmitter.event()
                    .name(eventName)
                    .data(data);

            if (id != null) {
                eventBuilder.id(id);
            }

            emitter.send(eventBuilder);
            return true;

        } catch (IOException e) {
            log.warn("SSE 메시지 전송 실패 - 연결이 끊어진 것으로 보임: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("SSE 메시지 전송 중 예기치 않은 오류: {}", e.getMessage(), e);
            return false;
        }
    }

    // 구독 해제
    private void remove(String roomId, SseEmitter emitter) {
        var list = byRoom.get(roomId);
        if (list != null) {
            synchronized (list) {
                list.remove(emitter);
                log.debug("SSE 구독자 제거 - roomId: {}, 남은 구독자 수: {}", roomId, list.size());

                if (list.isEmpty()) {
                    byRoom.remove(roomId);
                    log.info("빈 룸 제거 - roomId: {}", roomId);
                }
            }
        }
    }

    // 디버깅용: 현재 활성 연결 상태 조회
    public Map<String, Integer> getActiveConnections() {
        Map<String, Integer> result = new HashMap<>();
        byRoom.forEach((roomId, emitters) -> result.put(roomId, emitters.size()));
        return result;
    }

    // 특정 룸의 모든 연결 강제 종료
    public void closeRoom(String roomId) {
        var list = byRoom.remove(roomId);
        if (list != null) {
            synchronized (list) {
                for (var emitter : list) {
                    try {
                        emitter.complete();
                    } catch (Exception e) {
                        log.warn("SSE 연결 종료 중 에러: {}", e.getMessage());
                    }
                }
                log.info("룸 강제 종료 완료 - roomId: {}, 종료된 연결 수: {}", roomId, list.size());
            }
        }
    }

    // SseHub.java
    public void sendHeartbeat(String roomId) {
        push(roomId, "ping", "keep-alive");
    }


}