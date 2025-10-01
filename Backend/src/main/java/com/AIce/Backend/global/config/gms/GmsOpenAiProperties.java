package com.AIce.Backend.global.config.gms;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "gms.openai")
@lombok.Getter @lombok.Setter
public class GmsOpenAiProperties {
    private String baseUrl;
    private String completionsPath;
    private String model;
    private String apiKey;
    private long timeoutMs = 30000; // 10초
}
