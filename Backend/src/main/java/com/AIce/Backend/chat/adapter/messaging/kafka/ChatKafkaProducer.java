package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.HeadersV1;
import com.AIce.Backend.chat.contracts.RawRequestV1;
import com.AIce.Backend.global.config.kafka.KafkaTopicsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatKafkaProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final KafkaTopicsProperties topics;

    // raw 토픽 발행
    public void publishRaw(String roomId, RawRequestV1 payload) {
        kafkaTemplate.send(topics.getRaw(), roomId, payload);
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