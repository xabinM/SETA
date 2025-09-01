package com.AIce.Backend.global.enums;

import lombok.Getter;

@Getter
public enum ResponseMessage {
    // Auth
    SIGNUP_SUCCESS("회원 가입에 성공하였습니다."),
    LOGIN_SUCCESS("로그인에 성공했습니다."),
    WITHDRAW_SUCCESS("회원 탈퇴되었습니다."),
    SUCCESS_LOGOUT("로그아웃 되었습니다."),

    USER_NOT_FOUND_EXCEPTION("사용자를 찾을 수 없습니다."),
    PASSWORD_NOT_MATCH_EXCEPTION("비밀번호가 일치하지 않습니다."),
    SIGNUP_USERNAME_DUPLICATE_EXCEPTION("이미 존재하는 아이디입니다."),
    EXPIRED_TOKEN("만료된 토큰입니다."),
    INVALID_TOKEN("유효하지 않은 토큰입니다."),
    LOGGED_OUT_TOKEN("로그 아웃된 토큰입니다."),
    INVALID_CLAIM_TYPE("토큰에 클레임이 없거나 형식이 올바르지 않습니다."),
    ALREADY_WITHDRAW_USER("이미 탈퇴한 회원입니다."),

    // api
    PYTHON_SERVER_NO_RESPONSE("Python 서버에서 응답이 없습니다."),
    PROBLEM_GENERATION_FAILED("문제가 생성되지 않았습니다."),
    PROBLEM_COUNT_MISMATCH("요청한 문제 개수와 맞지 않습니다."),

    ;

    private final String message;

    ResponseMessage(String message) {
        this.message = message;
    }
}
