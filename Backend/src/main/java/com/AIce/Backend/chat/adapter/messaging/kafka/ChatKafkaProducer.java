package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.HeadersV1;
import com.AIce.Backend.chat.contracts.RawRequestV1;
import com.AIce.Backend.global.config.kafka.KafkaTopicsProperties;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final KafkaTopicsProperties topics;
    private final Tracer tracer;

    // raw 토픽 발행
    @Observed(name = "chat.raw.produce", contextualName = "kafka.produce.raw")
    public void publishRaw(String roomId, RawRequestV1 payload) {
        String traceId = tracer.currentSpan().context().traceId();
        if (payload.getHeaders() != null) {
            payload.getHeaders().setTrace_id(traceId);
        }

        kafkaTemplate.send(topics.getRaw(), roomId, payload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("kafka send failed traceId={}", traceId, ex);
                    } else {
                        var md = result.getRecordMetadata();
                        log.info("kafka sent traceId={} topic={} partition={} offset={} roomId={}",
                                traceId, md.topic(), md.partition(), md.offset(), roomId);
                    }
                });
    }

    public static HeadersV1 header(String traceId, String producer, String schema) {
        var h = new HeadersV1();
        h.setTrace_id(traceId);
        h.setProducer(producer);
        h.setSchema_version(schema);
        h.setContent_type("application/json");
        h.setCreated_at_ms(System.currentTimeMillis());
        return h;
    }
}
