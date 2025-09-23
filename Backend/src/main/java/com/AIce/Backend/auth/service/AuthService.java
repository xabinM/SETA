package com.AIce.Backend.auth.service;

import com.AIce.Backend.auth.dto.login.LoginDto;
import com.AIce.Backend.auth.dto.login.LoginRequest;
import com.AIce.Backend.auth.dto.me.UserResponseDto;
import com.AIce.Backend.auth.dto.signup.SignupRequest;
import com.AIce.Backend.auth.dto.signup.Tokens;
import com.AIce.Backend.auth.exception.DuplicateUsernameException;
import com.AIce.Backend.auth.exception.InvalidTokenException;
import com.AIce.Backend.auth.exception.NotFoundUserException;
import com.AIce.Backend.auth.exception.WrongPasswordException;
import com.AIce.Backend.auth.jwt.JwtTokenProvider;
import com.AIce.Backend.domain.user.entity.User;
import com.AIce.Backend.domain.user.repository.UserRepository;
import com.AIce.Backend.domain.usersetting.entity.UserSetting;
import com.AIce.Backend.domain.usersetting.repository.UserSettingRepository;
import com.AIce.Backend.global.enums.PreferredTone;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String BLACKLIST_STATUS_REISSUE = "reissued";
    private static final String BLACKLIST_STATUS_LOGOUT = "logout";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisService redisService;
    private final UserSettingRepository userSettingRepository;

    public void signup(SignupRequest request) {
        validateDuplicateUsername(request.getUsername());

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.from(request.getUsername(), encodedPassword, request.getName());

        userRepository.save(user);

        // === UserSetting 기본값 생성 ===
        UserSetting setting = UserSetting.builder()
                .user(user)
                .callMe("사용자")
                .roleDescription("일반 사용자")
                .preferredTone(PreferredTone.NEUTRAL)
                .traits("")
                .additionalContext("")
                .build();

        userSettingRepository.save(setting);
    }

    private void validateDuplicateUsername(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateUsernameException();
        }
    }

    public LoginDto login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(NotFoundUserException::new);

        if (!user.isPasswordMatching(passwordEncoder, request.getPassword())) {
            throw new WrongPasswordException();
        }


        Tokens tokens = jwtTokenProvider.generateTokens(user.getUserId());

        return new LoginDto(user.getUserId(), user.getName(), tokens);
    }

    public void logout(String refreshToken) {
        jwtTokenProvider.validateToken(refreshToken);

        if (redisService.isBlacklisted(refreshToken)) {
            throw new InvalidTokenException();
        }

        redisService.addToBlacklist(refreshToken, BLACKLIST_STATUS_LOGOUT);
    }

    public Tokens reissueToken(String refreshToken) {

        jwtTokenProvider.validateToken(refreshToken);

        if (redisService.isBlacklisted(refreshToken)) {
            throw new InvalidTokenException();
        }
        redisService.addToBlacklist(refreshToken, BLACKLIST_STATUS_REISSUE);

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

        return jwtTokenProvider.generateTokens(userId);
    }

    public UserResponseDto getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserResponseDto.builder()
                .username(user.getUsername())
                .name(user.getName())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

}
