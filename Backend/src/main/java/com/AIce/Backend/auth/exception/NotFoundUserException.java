package com.AIce.Backend.auth.exception;

import com.AIce.Backend.global.enums.ResponseMessage;
import com.AIce.Backend.global.exception.BusinessException;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class NotFoundUserException extends BusinessException {

    private static final String FAIL_CODE = "4000";

    public NotFoundUserException() {
        super(FAIL_CODE, HttpStatus.NOT_FOUND);
    }

    public String getMessage() {
        return ResponseMessage.USER_NOT_FOUND_EXCEPTION.getMessage();
    }
}
