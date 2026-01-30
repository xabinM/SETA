package com.AIce.Backend.domain.chat.repository;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    Optional<List<ChatMessage>> findByChatRoom_ChatRoomIdAndUser_UserIdOrderByCreatedAtDesc(UUID chatRoomId, Long userId);

    @Query("select coalesce(max(m.turnIndex),0) from ChatMessage m where m.chatRoom.chatRoomId = :roomId")
    int findMaxTurnIndex(@Param("roomId") UUID roomId);

    void deleteAllByChatRoom_ChatRoomId(UUID roomId);

    List<ChatMessage> findByContentContaining(String keyword);

    // Full-Text Search를 위한 Native Query
    @Query(value = "SELECT * FROM chat_message WHERE to_tsvector('english', content) @@ to_tsquery('english', :keyword)", nativeQuery = true)
    List<ChatMessage> searchByFullText(@Param("keyword") String keyword);
}
