package com.AIce.Backend.domain.chat.repository;


import com.AIce.Backend.domain.chat.entity.ChatRoom;
import com.AIce.Backend.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    Optional<List<ChatRoom>> findByUserOrderByUpdatedAtDesc(User user);
    Optional<ChatRoom> findByChatRoomIdAndUser(UUID chatRoomId, User user);
    boolean existsByChatRoomIdAndUser_UserId(UUID chatRoomId, Long userId);
    ChatRoom findByChatRoomId(UUID chatRoomId);
}