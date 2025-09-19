package com.AIce.Backend.domain.chat.repository;

import com.AIce.Backend.domain.chat.entity.RoomSummaryState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface RoomSummaryStateRepository extends JpaRepository<RoomSummaryState, UUID> {
    @Modifying
    @Query(value = """
        INSERT INTO room_summary_state (chat_room_id, last_turn_end, last_summary_at)
        VALUES (:roomId, 0, NULL)
        ON CONFLICT (chat_room_id) DO NOTHING
        """, nativeQuery = true)
    void insertIfNotExist(@Param("roomId") UUID roomId);

    void deleteByChatRoom_ChatRoomId(UUID roomId);
}

