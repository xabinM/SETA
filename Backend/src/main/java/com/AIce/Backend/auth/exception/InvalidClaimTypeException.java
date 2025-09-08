package com.AIce.Backend.auth.exception;

import com.AIce.Backend.global.enums.ResponseMessage;
import org.springframework.http.HttpStatus;

public class InvalidClaimTypeException extends AuthorizationException{

    private static final String FAIL_CODE = "4008";

    public InvalidClaimTypeException() {
        super(FAIL_CODE, HttpStatus.UNAUTHORIZED);
    }

    public String getMessage() {
        return ResponseMessage.INVALID_CLAIM_TYPE.getMessage();
    }
}
