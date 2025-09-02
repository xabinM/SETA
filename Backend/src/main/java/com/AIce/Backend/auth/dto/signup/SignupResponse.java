package com.AIce.Backend.auth.dto.signup;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SignupResponse {

    private boolean success;
    private String message;
}
