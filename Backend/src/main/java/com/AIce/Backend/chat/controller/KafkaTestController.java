package com.AIce.Backend.chat.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/test")
public class KafkaTestController {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    // GET /test/send?msg=hello
    @GetMapping("/send")
    @Operation(summary="Kafka 테스트용")
    public String sendMessage(@RequestParam String msg) {
        kafkaTemplate.send("chat.raw.request.v1", msg);
        return "Message sent: " + msg;
    }
}
