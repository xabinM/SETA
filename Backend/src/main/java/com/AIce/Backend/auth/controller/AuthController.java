package com.AIce.Backend.auth.controller;

import com.AIce.Backend.auth.dto.login.LoginDto;
import com.AIce.Backend.auth.dto.login.LoginRequest;
import com.AIce.Backend.auth.dto.login.LoginResponse;
import com.AIce.Backend.auth.dto.logout.LogoutResponse;
import com.AIce.Backend.auth.dto.reissue.ReissueResponse;
import com.AIce.Backend.auth.dto.signup.SignupRequest;
import com.AIce.Backend.auth.dto.signup.SignupResponse;
import com.AIce.Backend.auth.dto.signup.Tokens;
import com.AIce.Backend.auth.service.AuthService;
import com.AIce.Backend.global.enums.ResponseMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody @Valid SignupRequest request) {
        authService.signup(request);

        return ResponseEntity.ok(new SignupResponse(ResponseMessage.SIGNUP_SUCCESS.getMessage()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {

        LoginDto dto = authService.login(request);
        return ResponseEntity.ok(new LoginResponse(ResponseMessage.LOGIN_SUCCESS.getMessage(),
                dto.getUserId(), dto.getName(), dto.getTokens())
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("RefreshToken") String refreshToken) {
        authService.logout(refreshToken);

        return ResponseEntity.ok(new LogoutResponse(ResponseMessage.SUCCESS_LOGOUT.getMessage()));
    }

    @PostMapping("/reissue")
    public ResponseEntity<?> reissueToken(@RequestHeader("RefreshToken") String refreshToken) {
        Tokens tokens = authService.reissueToken(refreshToken);

        return ResponseEntity.ok(new ReissueResponse(ResponseMessage.SUCCESS_TOKEN_REISSUE.getMessage(), tokens));
    }

    // maybe 회원 정보 수정, 회원 탈퇴
}
