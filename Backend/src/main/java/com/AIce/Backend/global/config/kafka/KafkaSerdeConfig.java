package com.AIce.Backend.global.config.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 공용 직렬화 컴포넌트 제공
@Configuration
public class KafkaSerdeConfig {
    @Bean
    public ObjectMapper objectMapper() { return new ObjectMapper(); }
}