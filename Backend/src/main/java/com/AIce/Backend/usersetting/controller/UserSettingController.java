package com.AIce.Backend.usersetting.controller;

import com.AIce.Backend.usersetting.dto.UserSettingDto;
import com.AIce.Backend.usersetting.dto.UserSettingResponse;
import com.AIce.Backend.usersetting.dto.UserSettingUpdateRequest;
import com.AIce.Backend.usersetting.service.UserSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/user-settings")
public class UserSettingController {

    private final UserSettingService userSettingService;

    @Operation(summary = "내 세팅 조회")
    @GetMapping("/me")
    public UserSettingResponse getMySetting(@AuthenticationPrincipal Long userId) {
        log.warn("userId: "+ userId);
        return userSettingService.getMySetting(userId);
    }

    @Operation(summary = "내 세팅 최초 입력")
    @PostMapping("/me")
    @ResponseStatus(HttpStatus.CREATED)
    public UserSettingResponse createMySetting(@AuthenticationPrincipal Long userId, @Valid @RequestBody UserSettingDto req) {
        return userSettingService.createMySetting(userId, req);
    }

    @Operation(summary = "내 세팅 수정(PATCH)")
    @PatchMapping("/me")
    public UserSettingResponse updateMySetting(@AuthenticationPrincipal Long userId, @Valid @RequestBody UserSettingUpdateRequest req) {
        return userSettingService.updateMySetting(userId, req);
    }
}
