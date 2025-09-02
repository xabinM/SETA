package com.AIce.Backend.auth.exception;

import com.AIce.Backend.global.enums.ResponseMessage;
import org.springframework.http.HttpStatus;

public class LoggedOutTokenException extends AuthorizationException {

    private static final String FAIL_CODE = "4009";

    public LoggedOutTokenException() {
        super(FAIL_CODE, HttpStatus.FORBIDDEN);
    }

    public String getMessage() {
        return ResponseMessage.LOGGED_OUT_TOKEN.getMessage();
    }
}
