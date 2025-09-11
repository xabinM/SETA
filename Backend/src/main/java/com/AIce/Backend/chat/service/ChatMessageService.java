package com.AIce.Backend.chat.service;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import com.AIce.Backend.domain.chat.repository.ChatMessageRepository;
import com.AIce.Backend.chat.adapter.messaging.kafka.ChatKafkaProducer;
import com.AIce.Backend.chat.contracts.*;
import com.AIce.Backend.domain.chat.repository.ChatRoomRepository;
import com.AIce.Backend.domain.user.repository.UserRepository;
import com.AIce.Backend.global.enums.ChatMessageRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessagerepo;
    private final ChatRoomRepository chatRoomrepo;
    private final UserRepository userrepo;
    private final ChatKafkaProducer producer;

    public UUID handleUserMessage(String roomId, Long userId, String text,
                                  String sessionId, String traceId, String userAgent) {
        UUID mid = UUID.randomUUID();
        var roomUuid = UUID.fromString(roomId);
        var room = chatRoomrepo.findById(roomUuid)
                .orElseThrow(() -> new IllegalArgumentException("chat room not found: " + roomUuid));

        // DB 저장 (user message)
        var entity = ChatMessage.builder()
                .messageId(mid)
                .chatRoom(room)
                .user(userrepo.findByUserId(userId))
                .role(ChatMessageRole.valueOf("user"))
                .content(text)
                .createdAt(LocalDateTime.now())
                .build();
        chatMessagerepo
                .save(entity);

        // raw 발행
        var payload = new RawRequestV1();
        payload.setRoom_id(roomId);
        payload.setMessage_id(mid.toString());
        payload.setSession_id(sessionId);
        payload.setUser_id(userId != null ? String.valueOf(userId) : null);
        payload.setTimestamp(System.currentTimeMillis());
        payload.setText(text);
        payload.setChannel("web");
        payload.setUser_agent(userAgent);
        payload.setSchema_version("1.0.0");
        payload.setHeaders(ChatKafkaProducer.header(
                traceId, "gateway", "1.0.0"
        ));

        producer.publishRaw(roomId, payload);
        return mid;
    }
}
