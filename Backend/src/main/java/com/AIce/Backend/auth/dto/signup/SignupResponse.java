package com.AIce.Backend.auth.dto.signup;

import com.AIce.Backend.global.dto.SuccessResponse;

import lombok.Getter;
@Getter
public class SignupResponse extends SuccessResponse {

    public SignupResponse(String message) {
        super(true, message);
    }
}
