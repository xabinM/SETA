package com.AIce.Backend.global.config.gms;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean(name = "titleUpdateExecutor")
    public Executor titleUpdateExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(4);  // 기본 스레드 사이즈
        ex.setMaxPoolSize(8);   // 최대 스레드 사이즈
        ex.setQueueCapacity(200);   // 스레드 대기 큐의 사이즈
        ex.setThreadNamePrefix("title-updater-");   // 스레드 이름
        ex.initialize();
        return ex;
    }

}
