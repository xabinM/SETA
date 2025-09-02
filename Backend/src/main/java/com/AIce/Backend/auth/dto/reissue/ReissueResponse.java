package com.AIce.Backend.auth.dto.reissue;

import com.AIce.Backend.auth.dto.signup.Tokens;
import com.AIce.Backend.global.dto.SuccessResponse;
import lombok.Getter;

@Getter
public class ReissueResponse extends SuccessResponse {

    private final Tokens tokens;

    public ReissueResponse(String message, Tokens tokens) {
        super(true, message);
        this.tokens = tokens;
    }
}
