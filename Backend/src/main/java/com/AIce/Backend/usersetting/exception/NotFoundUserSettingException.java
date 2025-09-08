package com.AIce.Backend.usersetting.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundUserSettingException extends RuntimeException {
    public NotFoundUserSettingException(String msg) { super(msg); }
}
