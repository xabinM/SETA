package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.FilterResultV1;
import com.AIce.Backend.global.sse.SseHub;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FilterResultConsumer {
    private final SseHub hub;
    private final Tracer tracer;

    // filter result SSE 중계
    @Observed(name = "chat.filter_result.consume",
            contextualName = "kafka.consume.filter_result")
    @KafkaListener(topics = "chat.filter.result.v1", containerFactory = "kafkaListenerContainerFactory")
    public void onFilter(@Payload FilterResultV1 msg,
                         @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        String traceId = tracer.currentSpan().context().traceId();
        log.info("consume filter_result traceId={} topic={} room={}", traceId, topic, msg.getRoom_id());
        hub.push(msg.getRoom_id(), "filter_result", msg);
    }
}