package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.LlmResponseV1;
import com.AIce.Backend.global.sse.SseHub;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Headers;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static org.hibernate.internal.util.NullnessHelper.coalesce;

@Slf4j
@Component
@RequiredArgsConstructor
public class LlmAnswerConsumer {
    private final SseHub hub;
    private final Tracer tracer;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    // llm answer SSE 중계
    @Observed(name = "chat.llm_answer.consume", contextualName = "kafka.consume.llm_answer")
    @KafkaListener(topics = "chat.llm.answer.v1", groupId = "backend-local", containerFactory = "stringKafkaListenerFactory")
    public void onAnswer(
            @Payload String payload,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Headers Map<String, Object> headers) throws JsonProcessingException {
        try {
            LlmResponseV1 msg = objectMapper.readValue(payload, LlmResponseV1.class);

            // traceId 우선순위: 본문(trace_id) -> Kafka 헤더(trace_id) -> 현재 Span -> 빈 문자열
            String traceId =
                    coalesce(
                            msg.getTrace_id(),
                            headerAsString(headers, "trace_id"),
                            Optional.ofNullable(tracer)
                                    .map(Tracer::currentSpan)
                                    .map(span -> span.context().traceId())
                                    .orElse(null),
                            ""
                    );

            log.info("consume llm_answer traceId={} topic={} room={}", traceId, topic, msg.getRoom_id());

            // SSE 브로드캐스트
            hub.push(msg.getRoom_id(), "llm_answer", msg);

        } catch (Exception e) {
            log.warn("llm_answer consume failed; payload={} cause={}", safeCut(payload), e.toString());
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
