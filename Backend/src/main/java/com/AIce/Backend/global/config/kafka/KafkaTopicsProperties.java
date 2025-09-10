package com.AIce.Backend.global.config.kafka;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.topics")
public class KafkaTopicsProperties {
    private String raw;           // chat.raw.request.v1
    private String filterResult;  // chat.filter.result.v1
    private String promptBuilt;   // chat.prompt.built.v1
    private String llmAnswer;     // chat.llm.answer.v1
    private String error;         // chat.error.v1
}