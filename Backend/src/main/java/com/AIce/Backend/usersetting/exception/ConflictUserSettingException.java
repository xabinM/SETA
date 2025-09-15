package com.AIce.Backend.usersetting.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictUserSettingException extends RuntimeException {
    public ConflictUserSettingException(String msg) { super(msg); }
}