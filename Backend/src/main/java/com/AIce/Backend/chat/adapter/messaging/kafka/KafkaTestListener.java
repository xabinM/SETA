package com.AIce.Backend.chat.adapter.messaging.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class KafkaTestListener {

    @KafkaListener(topics = "chat.raw.request.v1", groupId = "test-group")
    public void listen(String message) {
        log.info("received message: {}", message);
    }
}