package com.AIce.Backend.auth.exception;

import com.AIce.Backend.global.enums.ResponseMessage;
import com.AIce.Backend.global.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class WrongPasswordException extends BusinessException {

    private static final String FAIL_CODE = "4002";

    public WrongPasswordException() {
        super(FAIL_CODE, HttpStatus.NOT_FOUND);
    }

    @Override
    public String getMessage() {
        return ResponseMessage.PASSWORD_NOT_MATCH_EXCEPTION.getMessage();
    }
}
