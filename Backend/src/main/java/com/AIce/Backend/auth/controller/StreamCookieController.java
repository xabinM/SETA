package com.AIce.Backend.auth.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class StreamCookieController {

    @PostMapping("/stream-cookie")
    public ResponseEntity<Void> issueStreamCookie(
            @RequestParam("token") String accessToken,
            HttpServletResponse response
    ) {
        Cookie cookie = new Cookie("access_token", accessToken);
        cookie.setHttpOnly(true); // JS에서 접근 불가
        cookie.setSecure(true);   // HTTPS에서만 전송
        cookie.setPath("/api/sse"); // SSE 엔드포인트에만 전송
        cookie.setMaxAge(60 * 60); // 1시간

        // SameSite=None → cross-site에서도 쿠키 전송 허용
        cookie.setAttribute("SameSite", "None");

        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/stream-cookie")
    public ResponseEntity<Void> clearStreamCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("access_token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/sse");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "None");

        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }
}
