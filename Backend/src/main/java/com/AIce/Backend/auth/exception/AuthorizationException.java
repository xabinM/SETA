package com.AIce.Backend.auth.exception;

import com.AIce.Backend.global.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class AuthorizationException extends BusinessException {
    public AuthorizationException(String code, HttpStatus httpStatus) {
        super(code, httpStatus);
    }
}
