package com.AIce.Backend.auth.service;

import com.AIce.Backend.auth.dto.SignupRequest;
import com.AIce.Backend.auth.exception.DuplicateUsernameException;
import com.AIce.Backend.domain.user.entity.User;
import com.AIce.Backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void signup(SignupRequest request) {
        validateDuplicateUsername(request.getUsername());

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.from(request.getUsername(), encodedPassword, request.getName());

        userRepository.save(user);
    }

    private void validateDuplicateUsername(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateUsernameException();
        }
    }
}
