package com.AIce.Backend.auth.config;

import com.AIce.Backend.auth.jwt.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    @Bean
    public JwtTokenProvider jwtTokenProvider(
            @Value("${jwt.secret}") String key,
            @Value("${jwt.accessTokenExpirationMs}") long accessTokenExpirationMs,
            @Value("${jwt.refreshTokenExpirationMs}") long refreshTokenExpiration
    ) {
        return new JwtTokenProvider(key, accessTokenExpirationMs, refreshTokenExpiration);
    }
}