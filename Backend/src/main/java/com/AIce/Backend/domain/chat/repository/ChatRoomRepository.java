package com.AIce.Backend.domain.chat.repository;


import com.AIce.Backend.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
}