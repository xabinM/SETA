package com.AIce.Backend.auth.dto.signup;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SignupRequest {

    @NotBlank(message = "아이디를 입력해주세요.")
//    @Size(min = 5, max = 15, message = "아이디는 5글자 이상 15글자 이하로 입력해주세요.")
    private final String username;

    @NotBlank
//    @Size(min = 8, max = 20, message = "비밀번호는 8글자 이상 20글자 이하로 입력해주세요.")
    private final String password;

    @NotBlank(message = "이름을 입력해주세요.")
    private final String name;
}
