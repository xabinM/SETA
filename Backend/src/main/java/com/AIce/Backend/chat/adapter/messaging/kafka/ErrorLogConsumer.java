package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.ErrorLogV1;
import com.AIce.Backend.global.sse.SseHub;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ErrorLogConsumer {
    private final SseHub hub;

    // error SSE 중계
    @KafkaListener(topics = "${app.topics.error:chat.error.v1}", containerFactory = "kafkaListenerContainerFactory")
    public void onError(@Payload ErrorLogV1 msg) {
        String room = (msg.getRoom_id() != null) ? msg.getRoom_id() : "GLOBAL";
        hub.push(room, "error", msg);
    }
}

