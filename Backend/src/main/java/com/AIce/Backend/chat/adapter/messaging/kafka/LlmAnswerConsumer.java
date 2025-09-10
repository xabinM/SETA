package com.AIce.Backend.chat.adapter.messaging.kafka;

import com.AIce.Backend.chat.contracts.LlmResponseV1;
import com.AIce.Backend.global.sse.SseHub;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LlmAnswerConsumer {
    private final SseHub hub;

    // llm answer SSE 중계
    @KafkaListener(topics = "${app.topics.llmAnswer}", containerFactory = "kafkaListenerContainerFactory")
    public void onAnswer(@Payload LlmResponseV1 msg) {
        hub.push(msg.getRoom_id(), "llm_answer", msg);
    }
}