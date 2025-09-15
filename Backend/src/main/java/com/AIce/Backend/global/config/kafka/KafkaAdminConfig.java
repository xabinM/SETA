package com.AIce.Backend.global.config.kafka;

import org.springframework.context.annotation.Configuration;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

// 로컬에서 토픽 없을 때 자동 생성
@Configuration
public class KafkaAdminConfig {
    @Bean
    public NewTopic topicRaw(@Value("${app.topic-spec.raw.partitions:3}") int p) {
        return new NewTopic("chat.raw.request.v1", p, (short)1);
    }
    @Bean
    public NewTopic topicFilter() { return new NewTopic("chat.filter.result.v1", 3, (short)1); }
    @Bean
    public NewTopic topicPrompt() { return new NewTopic("chat.prompt.built.v1", 3, (short)1); }
    @Bean
    public NewTopic topicAnswer() { return new NewTopic("chat.llm.answer.v1", 3, (short)1); }
    @Bean
    public NewTopic topicError() { return new NewTopic("chat.error.v1", 3, (short)1); }
}