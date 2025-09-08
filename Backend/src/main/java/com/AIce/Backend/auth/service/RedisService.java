package com.AIce.Backend.auth.service;

import com.AIce.Backend.auth.util.RedisKeyFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    private final RedisTemplate<String, String> redisTemplate;
    private final long refreshTokenExpirationMs;
    private final RedisKeyFactory redisKeyFactory;

    public RedisService(
            @Qualifier("authRedisTemplate") RedisTemplate<String, String> redisTemplate,
            @Value("${jwt.refreshTokenExpirationMs}") long refreshTokenExpirationMs,
            RedisKeyFactory redisKeyFactory
    ) {
        this.redisTemplate = redisTemplate;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.redisKeyFactory = redisKeyFactory;
    }

    public void addToBlacklist(String token, String value) {
        String key = redisKeyFactory.getBlacklistKey(token);
        redisTemplate.opsForValue().set(key, value, refreshTokenExpirationMs, TimeUnit.MILLISECONDS);
    }

    public boolean isBlacklisted(String token) {
        String key = redisKeyFactory.getBlacklistKey(token);
        return redisTemplate.hasKey(key);
    }
}
