package com.AIce.Backend.auth.exception;

import com.AIce.Backend.global.enums.ResponseMessage;
import org.springframework.http.HttpStatus;

public class InvalidTokenException extends AuthorizationException {

    private static final String FAIL_CODE = "4007";

    public InvalidTokenException() {
        super(FAIL_CODE, HttpStatus.FORBIDDEN);
    }

    public String getMessage() {
        return ResponseMessage.INVALID_TOKEN.getMessage();
    }
}
