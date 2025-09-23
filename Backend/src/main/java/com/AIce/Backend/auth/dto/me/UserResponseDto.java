package com.AIce.Backend.auth.dto.me;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class UserResponseDto {
    private String username;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}