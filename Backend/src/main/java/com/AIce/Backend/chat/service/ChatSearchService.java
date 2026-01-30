package com.AIce.Backend.chat.service;

import com.AIce.Backend.chat.dto.ChatMessageDto;
import com.AIce.Backend.domain.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatSearchService {

    private final ChatMessageRepository chatMessageRepository;

    @Transactional(readOnly = true)
    public List<ChatMessageDto> searchByLike(String keyword) {
        return chatMessageRepository.findByContentContaining(keyword)
                .stream()
                .map(ChatMessageDto::new) // 엔티티를 DTO로 변환
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> searchByFts(String keyword) {
        String ftsKeyword = keyword.replaceAll("\\s+", " & ");
        return chatMessageRepository.searchByFullText(ftsKeyword)
                .stream()
                .map(ChatMessageDto::new) // 엔티티를 DTO로 변환
                .collect(Collectors.toList());
    }
}
