package com.AIce.Backend.auth.dto.login;

import com.AIce.Backend.auth.dto.signup.Tokens;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {

    private final Long userId;
    private final String name;
    private final Tokens tokens;
    private final String message;
}
