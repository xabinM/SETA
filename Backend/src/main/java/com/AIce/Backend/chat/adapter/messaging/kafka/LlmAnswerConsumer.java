package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.LlmAnswerDeltaV1;
import com.AIce.Backend.chat.contracts.LlmAnswerDoneV1;
import com.AIce.Backend.chat.service.ChatMessageService;
import com.AIce.Backend.global.sse.SseHub;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Headers;
import org.springframework.messaging.handler.annotation.Payload;
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
    private final ObjectMapper objectMapper;
    private final ChatMessageService chatMessageService;

    // --- Delta 이벤트 수신 ---
    @Observed(name = "chat.llm_answer.delta.consume", contextualName = "kafka.consume.llm_answer.delta")
    @KafkaListener(topics = "chat.llm.answer.delta.v1", groupId = "backend-msk", containerFactory = "stringKafkaListenerFactory")
    public void onDelta(
            @Payload String payload,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Headers Map<String, Object> headers) throws JsonProcessingException {
        try {
            LlmAnswerDeltaV1 msg = objectMapper.readValue(payload, LlmAnswerDeltaV1.class);

            String traceId = resolveTraceId(msg.getTrace_id(), headers);

            log.info("consume llm_answer.delta traceId={} topic={} roomId={} messageId={}",
                    traceId, topic, msg.getRoom_id(), msg.getMessage_id());

            // 프론트로 delta 이벤트 전송
            hub.push(msg.getRoom_id(), "delta", msg);

        } catch (Exception e) {
            log.warn("llm_answer.delta consume failed; payload={} cause={}", safeCut(payload), e.toString());
        }
    }

    // --- Done 이벤트 수신 ---
    @Observed(name = "chat.llm_answer.done.consume", contextualName = "kafka.consume.llm_answer.done")
    @KafkaListener(topics = "chat.llm.answer.done.v1", groupId = "backend-msk", containerFactory = "stringKafkaListenerFactory")
    public void onDone(
            @Payload String payload,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Headers Map<String, Object> headers) throws JsonProcessingException {
        try {
            LlmAnswerDoneV1 msg = objectMapper.readValue(payload, LlmAnswerDoneV1.class);

            String traceId = resolveTraceId(msg.getTrace_id(), headers);

            log.info("consume llm_answer.done traceId={} topic={} roomId={} messageId={}",
                    traceId, topic, msg.getRoom_id(), msg.getMessage_id());

            // DB 저장
            chatMessageService.persistAssistantFromLlm(msg);

            // 프론트로 done 이벤트 전송
            hub.push(msg.getRoom_id(), "done", msg);

        } catch (Exception e) {
            log.warn("llm_answer.done consume failed; payload={} cause={}", safeCut(payload), e.toString());
        }
    }

    // === 유틸 ===
    private String resolveTraceId(String fromBody, Map<String, Object> headers) {
        return coalesce(
                fromBody,
                headerAsString(headers, "trace_id"),
                Optional.ofNullable(tracer)
                        .map(Tracer::currentSpan)
                        .map(span -> span.context().traceId())
                        .orElse(null),
                ""
        );
    }

    private static String headerAsString(Map<String, Object> headers, String key) {
        Object v = headers.get(key);
        if (v instanceof byte[] b) return new String(b, StandardCharsets.UTF_8);
        return Objects.toString(v, null);
    }

    private static String safeCut(String s) {
        return s == null ? "null" : (s.length() > 512 ? s.substring(0, 512) + "..." : s);
    }
}
