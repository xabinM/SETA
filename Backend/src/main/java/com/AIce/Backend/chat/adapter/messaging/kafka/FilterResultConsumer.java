package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.FilterResultV1;
import com.AIce.Backend.chat.contracts.LlmResponseV1;
import com.AIce.Backend.chat.service.ChatMessageService;
import com.AIce.Backend.chat.service.DropResponder;
import com.AIce.Backend.domain.chat.repository.ChatMessageRepository;
import com.AIce.Backend.domain.chat.repository.ChatRoomRepository;
import com.AIce.Backend.domain.usersetting.entity.UserSetting;
import com.AIce.Backend.domain.usersetting.repository.UserSettingRepository;
import com.AIce.Backend.global.sse.SseHub;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Headers;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class FilterResultConsumer {
    private final SseHub hub;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final ChatRoomRepository chatRoomRepository;
    private final UserSettingRepository userSettingRepository;
    private final DropResponder dropResponder;
    private final ChatMessageService chatMessageService;

    // filter result SSE 중계
    @Observed(name = "chat.filter_result.consume",
            contextualName = "kafka.consume.filter_result")
    @KafkaListener(topics = "chat.filter.result.v1", groupId = "backend-local", containerFactory = "stringKafkaListenerFactory")
    public void onFilter(@Payload String payload,
                         @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                         @Headers Map<String, Object> headers) throws JsonProcessingException {
        try {
            final FilterResultV1 msg = objectMapper.readValue(payload, FilterResultV1.class);
            final String roomId = msg.getRoom_id();

            // DROP이면
            if (msg.getDecision() != null && "DROP".equalsIgnoreCase(msg.getDecision().getAction())) {
                // DB 저장
                String text = chatMessageService.persistAssistantFromLlm(msg);

                final long now = System.currentTimeMillis();
                final long startTs = msg.getTimestamp() != null ? msg.getTimestamp() : now;
                final long latency = Math.max(0, now - startTs);

                for (int i = 0; i < text.length(); i++) {
                    String delta = String.valueOf(text.charAt(i));
                    hub.push(roomId, "delta", Map.of(
                            "trace_id", msg.getTrace_id(),
                            "message_id", msg.getMessage_id(),
                            "content", Map.of(
                                    "delta", delta,
                                    "index", i
                            ),
                            "status", "streaming"
                    ));
                }

                // SSE로 브로드캐스트
                log.info("DROP→synthetic llm_answer saved & streamed; traceId={} room={}",
                        msg.getTrace_id(), roomId);

                // done event 전송: 응답 처리 끝 신호
                hub.push(roomId, "done", Map.of(
                        "trace_id", msg.getTrace_id(),
                        "message_id", msg.getMessage_id(),
                        "content", Map.of(
                                "final_text", text,
                                "finish_reason", "stop"
                        ),
                        "usage", Map.of(
                                "prompt_tokens", 0,
                                "completion_tokens", 0,
                                "total_tokens", 0
                        ),
                        "status", "done"
                ));
            }

            log.info("consume filter_result traceId={} topic={} room={}", msg.getTrace_id(), topic, msg.getRoom_id());

        } catch (Exception e) {
            log.warn("filter_result consume failed; payload={} cause={}", safeCut(payload), e.toString());
        }
    }

    private static String headerAsString(Map<String, Object> headers, String key) {
        Object v = headers.get(key);
        if (v instanceof byte[] b) return new String(b, StandardCharsets.UTF_8);
        return Objects.toString(v, null);
    }

    @SafeVarargs
    private static <T> T coalesce(T... vals) {
        for (T v : vals) if (v != null && !(v instanceof String s && s.isBlank())) return v;
        return null;
    }
    private static String safeCut(String s) { return s == null ? "null" : (s.length() > 512 ? s.substring(0, 512) + "..." : s); }
}