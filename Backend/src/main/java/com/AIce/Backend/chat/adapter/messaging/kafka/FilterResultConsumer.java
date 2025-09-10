package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.FilterResultV1;
import com.AIce.Backend.global.config.kafka.KafkaTopicsProperties;
import com.AIce.Backend.global.sse.SseHub;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FilterResultConsumer {
    private final SseHub hub;
    private final KafkaTopicsProperties topics;

    // filter result SSE 중계
    @KafkaListener(topics = "${app.topics.filterResult}", containerFactory = "kafkaListenerContainerFactory")
    public void onFilter(@Payload FilterResultV1 msg) {
        hub.push(msg.getRoom_id(), "filter_result", msg);
    }
}