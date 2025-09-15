package com.AIce.Backend.auth.dto.login;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
public class LoginRequest {

    @NotBlank(message = "아이디를 입력해주세요.")
    private final String username;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    private final String password;

    @JsonCreator
    public LoginRequest(@JsonProperty("username") String username,
                        @JsonProperty("password") String password) {
        this.username = username;
        this.password = password;
    }
}
