package com.AIce.Backend.auth.dto.signup;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class Tokens {
    private String accessToken;
    private String refreshToken;
}
