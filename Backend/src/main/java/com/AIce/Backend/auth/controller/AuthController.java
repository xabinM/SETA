package com.AIce.Backend.auth.controller;

import com.AIce.Backend.auth.dto.SignupRequest;
import com.AIce.Backend.auth.dto.SignupResponse;
import com.AIce.Backend.auth.service.AuthService;
import com.AIce.Backend.global.enums.ResponseMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody @Valid SignupRequest request) {
        authService.signup(request);

        return ResponseEntity.ok(new SignupResponse(true, ResponseMessage.SIGNUP_SUCCESS.getMessage()));
    }
}
