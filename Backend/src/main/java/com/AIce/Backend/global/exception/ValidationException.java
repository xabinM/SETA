package com.AIce.Backend.global.exception;

import org.springframework.http.HttpStatus;

public class ValidationException extends BusinessException{

    private static final String FAIL_CODE = "3000";

    private final String validationMessage;

    public ValidationException(String validationMessage) {
        super(FAIL_CODE, HttpStatus.BAD_REQUEST);
        this.validationMessage = validationMessage;
    }

    @Override
    public String getMessage() {
        String PREFIX = "[입력값 에러] ";
        return PREFIX + validationMessage;
    }
}
