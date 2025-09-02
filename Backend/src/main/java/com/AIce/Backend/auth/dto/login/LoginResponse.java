package com.AIce.Backend.auth.dto.login;

import com.AIce.Backend.auth.dto.signup.Tokens;
import com.AIce.Backend.global.dto.SuccessResponse;
import lombok.Getter;

@Getter
public class LoginResponse extends SuccessResponse {

    private final Long userId;
    private final String name;
    private final Tokens tokens;

    public LoginResponse(String message, Long userId, String name, Tokens tokens) {
        super(true, message);
        this.userId = userId;
        this.name = name;
        this.tokens = tokens;
    }
}
