package com.AIce.Backend.global.config.kafka;

import org.springframework.context.annotation.Configuration;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.TopicBuilder;

// 토픽 자동 생성
@Configuration
public class KafkaAdminConfig {

    // 공통 상수 (ms)
    // 7일
    private static final String RETENTION_14D = String.valueOf(14L * 24 * 60 * 60 * 1000);  // 14일

    // TEST 용
    private static final String RETENTION_1D  = String.valueOf((long) 24 * 60 * 60 * 1000);  // 1일

    @Bean
    public NewTopic chatRawRequest() {
        return TopicBuilder.name("chat.raw.request.v1")
                .partitions(2)
                .config("retention.ms", RETENTION_1D)
                .config("cleanup.policy", "delete")
                .build();
    }

    @Bean
    public NewTopic chatFilterResult() {
        return TopicBuilder.name("chat.filter.result.v1")
                .partitions(2)
                .config("retention.ms", RETENTION_1D)
                .config("cleanup.policy", "delete")
                .build();
    }

    @Bean
    public NewTopic chatPromptBuilt() {
        return TopicBuilder.name("chat.prompt.built.v1")
                .partitions(2)
                .config("retention.ms", RETENTION_1D)
                .config("cleanup.policy", "delete")
                .build();
    }

    @Bean
    public NewTopic chatLlmAnswer() {
        return TopicBuilder.name("chat.llm.answer.v1")
                .partitions(2)
                .config("retention.ms", RETENTION_1D)
                .config("cleanup.policy", "delete")
                .build();
    }

    @Bean
    public NewTopic chatError() {
        return TopicBuilder.name("chat.error.v1")
                .partitions(2)
                .config("retention.ms", RETENTION_1D)
                .config("cleanup.policy", "delete")
                .build();
    }
}