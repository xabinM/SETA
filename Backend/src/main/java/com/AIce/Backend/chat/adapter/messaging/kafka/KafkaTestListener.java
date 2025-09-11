package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.RawRequestV1;
import org.springframework.messaging.handler.annotation.Header;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class KafkaTestListener {
    @KafkaListener(topics = "chat.raw.request.v1", groupId = "backend-local")
    public void listen(
            @Payload RawRequestV1 payload,
            @Header(org.springframework.kafka.support.KafkaHeaders.RECEIVED_KEY) String roomId
    ) {
        log.info("roomId={}, payload={}", roomId, payload);
    }
}