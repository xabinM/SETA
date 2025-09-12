package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.LlmResponseV1;
import com.AIce.Backend.global.sse.SseHub;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LlmAnswerConsumer {
    private final SseHub hub;
    private final Tracer tracer;

    // llm answer SSE 중계
    @Observed(name = "chat.llm_answer.consume",
            contextualName = "kafka.consume.llm_answer")
    @KafkaListener(topics = "${app.topics.llmAnswer}", containerFactory = "kafkaListenerContainerFactory")
    public void onAnswer(
            @Payload LlmResponseV1 msg,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {

        String traceId = tracer.currentSpan().context().traceId();
        log.info("consume llm_answer traceId={} topic={} room={}", traceId, topic, msg.getRoom_id());
        hub.push(msg.getRoom_id(), "llm_answer", msg);
    }
}
