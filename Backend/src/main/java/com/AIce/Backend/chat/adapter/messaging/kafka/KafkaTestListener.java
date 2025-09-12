package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.RawRequestV1;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaTestListener {

    private final Tracer tracer;

    @Observed(name = "chat.raw.consume", contextualName = "kafka.consume.raw")
    @KafkaListener(topics = "chat.raw.request.v1", groupId = "backend-local")
    public void listen(
            @Payload RawRequestV1 payload,
            @Header(KafkaHeaders.RECEIVED_KEY) String roomId,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

        String traceId = tracer.currentSpan().context().traceId();
        log.info("raw consumed traceId={} topic={} roomId={} payload={}", traceId, topic, roomId, payload);
    }
}
