package com.AIce.Backend.domain.chat.repository;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    // 채팅방의 전체 메시지 시간순 정렬
    List<ChatMessage> findByChatRoomIdOrderByCreatedAtAsc(UUID chatRoomId);

    // 채팅방 기준 페이징
    Page<ChatMessage> findByChatRoomId(UUID chatRoomId, Pageable pageable);

    // 외부 연동용 키로 단건 조회
    Optional<ChatMessage> findByExternalId(String externalId);

    // 작성자 기준 조회
    List<ChatMessage> findByAuthorId(Long authorId);

    // 방별 가장 최근 턴(turn_index) 조회
    Optional<ChatMessage> findTopByChatRoomIdOrderByTurnIndexDesc(UUID chatRoomId);

    // 방별 최신 생성시간 기준 최근 메시지
    Optional<ChatMessage> findTopByChatRoomIdOrderByCreatedAtDesc(UUID chatRoomId);
}