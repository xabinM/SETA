package com.AIce.Backend.domain.chat.repository;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    Optional<List<ChatMessage>> findByChatRoom_ChatRoomIdAndUser_UserIdOrderByCreatedAtDesc(UUID chatRoomId, Long userId);

    @Query("select coalesce(max(m.turnIndex),0) from ChatMessage m where m.chatRoom.chatRoomId = :roomId")
    int findMaxTurnIndex(@Param("roomId") UUID roomId);
}