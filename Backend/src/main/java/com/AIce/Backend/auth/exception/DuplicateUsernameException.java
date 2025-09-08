package com.AIce.Backend.auth.exception;

import com.AIce.Backend.global.enums.ResponseMessage;
import com.AIce.Backend.global.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class DuplicateUsernameException extends BusinessException {

    private static final String FAIL_CODE = "4001";

    public DuplicateUsernameException() {
        super(FAIL_CODE, HttpStatus.BAD_REQUEST);
    }

    @Override
    public String getMessage() {
        return ResponseMessage.SIGNUP_USERNAME_DUPLICATE_EXCEPTION.getMessage();
    }
}
