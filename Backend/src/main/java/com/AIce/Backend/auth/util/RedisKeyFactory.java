package com.AIce.Backend.auth.util;

import org.springframework.stereotype.Component;

@Component
public class RedisKeyFactory {

    private static final String BLACKLIST_PREFIX = "BL:";

    public String getBlacklistKey(String token) {
        return BLACKLIST_PREFIX + token;
    }
}
