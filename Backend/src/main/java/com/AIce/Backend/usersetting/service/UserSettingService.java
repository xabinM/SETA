package com.AIce.Backend.usersetting.service;

import com.AIce.Backend.domain.user.entity.User;
import com.AIce.Backend.domain.usersetting.entity.UserSetting;
import com.AIce.Backend.domain.user.repository.UserRepository;
import com.AIce.Backend.domain.usersetting.repository.UserSettingRepository;
import com.AIce.Backend.usersetting.dto.*;
import com.AIce.Backend.usersetting.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@RequiredArgsConstructor
@Service
public class UserSettingService {

    private final UserSettingRepository userSettingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserSettingResponse getMySetting(Long userId) {
        UserSetting us = userSettingRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new NotFoundUserSettingException("User setting not found"));
        return toResp(us);
    }

    @Transactional
    public UserSettingResponse createMySetting(Long userId, UserSettingDto req) {
        if (userSettingRepository.existsByUser_UserId(userId)) {
            throw new ConflictUserSettingException("User setting already exists");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundUserSettingException("User not found"));

        UserSetting us = new UserSetting();
        us.setUser(user);
        us.setCallMe(req.getCallMe());
        us.setRoleDescription(req.getRoleDescription());
        us.setPreferredTone(req.getPreferredTone());
        us.setTraits(req.getTraits());
        us.setAdditionalContext(req.getAdditionalContext());

        userSettingRepository.save(us);
        return toResp(us);
    }

    @Transactional
    public UserSettingResponse updateMySetting(Long userId, UserSettingUpdateRequest req) {
        UserSetting us = userSettingRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new NotFoundUserSettingException("User setting not found"));

        if (req.getCallMe() != null) us.setCallMe(req.getCallMe());
        if (req.getRoleDescription() != null) us.setRoleDescription(req.getRoleDescription());
        if (req.getPreferredTone() != null) us.setPreferredTone(req.getPreferredTone());
        if (req.getTraits() != null) us.setTraits(req.getTraits());
        if (req.getAdditionalContext() != null) us.setAdditionalContext(req.getAdditionalContext());

        return toResp(us);
    }

    private UserSettingResponse toResp(UserSetting us) {
        return UserSettingResponse.builder()
                .userSettingId(us.getUserSettingId())
                .userId(us.getUser().getUserId())
                .callMe(us.getCallMe())
                .roleDescription(us.getRoleDescription())
                .preferredTone(us.getPreferredTone())
                .traits(us.getTraits())
                .additionalContext(us.getAdditionalContext())
                .createdAt(us.getCreatedAt())
                .updatedAt(us.getUpdatedAt())
                .build();
    }
}