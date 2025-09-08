package com.AIce.Backend.auth.dto.logout;

import com.AIce.Backend.global.dto.SuccessResponse;
import lombok.Getter;

@Getter
public class LogoutResponse extends SuccessResponse {

    public LogoutResponse(String message) {
        super(true, message);
    }
}
