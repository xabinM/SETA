package com.AIce.Backend.domain.chat.repository;


import com.AIce.Backend.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.*;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    // 이름으로 방 조회
    Optional<ChatRoom> findByName(String name);

    // 생성 시간 역순으로 전체 방 목록
    List<ChatRoom> findAllByOrderByCreatedAtDesc();

    // 특정 기간 내 생성된 방 목록
    List<ChatRoom> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}