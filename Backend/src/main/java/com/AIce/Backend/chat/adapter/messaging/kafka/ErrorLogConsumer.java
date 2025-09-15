package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.ErrorLogV1;
import com.AIce.Backend.global.sse.SseHub;
import com.fasterxml.jackson.core.JsonProcessingException;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class ErrorLogConsumer {
    private final SseHub hub;
    private final Tracer tracer;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    // error SSE 중계
    @Observed(name = "chat.error.consume")
    @KafkaListener(topics = "chat.error.v1", containerFactory = "stringKafkaListenerFactory")
    public void onError(@Payload String payload,
                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                        @Headers Map<String, Object> headers) throws JsonProcessingException {
        try {
            ErrorLogV1 msg = objectMapper.readValue(payload, ErrorLogV1.class);
            String room = (msg.getRoom_id() != null) ? msg.getRoom_id() : "GLOBAL";

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

            log.info("consume error traceId={} topic={} room={}", traceId, topic, msg.getRoom_id());

            // SSE 브로드캐스트
            hub.push(room, "error", msg);

        } catch (Exception e) {
            log.warn("error consume failed; payload={} cause={}", safeCut(payload), e.toString());
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
