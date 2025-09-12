package com.AIce.Backend.chat.service;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import com.AIce.Backend.domain.chat.repository.ChatMessageRepository;
import com.AIce.Backend.chat.adapter.messaging.kafka.ChatKafkaProducer;
import com.AIce.Backend.chat.contracts.*;
import com.AIce.Backend.domain.chat.repository.ChatRoomRepository;
import com.AIce.Backend.domain.user.repository.UserRepository;
import com.AIce.Backend.global.enums.ChatMessageRole;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final Tracer tracer;
    private final ChatMessageRepository chatMessagerepo;
    private final ChatRoomRepository chatRoomrepo;
    private final UserRepository userrepo;
    private final ChatKafkaProducer producer;

    @Observed(name = "chat.handleUserMessage")
    @Transactional
    public void handleUserMessage(String roomId, Long userId, String text) {
        String traceId = tracer.currentSpan().context().traceId();

        var roomUuid = UUID.fromString(roomId);
        var room = chatRoomrepo.findById(roomUuid)
                .orElseThrow(() -> new IllegalArgumentException("chat room not found: " + roomUuid));

        // turn 계산
        int turnIdx = chatMessagerepo.findMaxTurnIndex(room.getChatRoomId()) + 1;

        // DB 저장
        ChatMessage entity = ChatMessage.builder()
                .chatRoom(room)
                .user(userrepo.findByUserId(userId))
                .role(ChatMessageRole.valueOf("user"))
                .content(text)
                .externalId(traceId)
                .createdAt(LocalDateTime.now())
                .turnIndex(turnIdx)
                .build();
        chatMessagerepo.save(entity);

        if (turnIdx == 1) {
            // TO DO: 메세지 요약해서 채팅방 제목 update
        }

        // raw 발행
        var payload = new RawRequestV1();
        payload.setTrace_id(traceId);
        payload.setRoom_id(roomId);
        payload.setMessage_id(entity.getMessageId().toString());
        payload.setUser_id(userId != null ? String.valueOf(userId) : null);
        payload.setTimestamp(System.currentTimeMillis());
        payload.setText(text);
        payload.setSchema_version("1.0.0");
        payload.setHeaders(ChatKafkaProducer.header(
                traceId, "gateway", "1.0.0"
        ));

        producer.publishRaw(roomId, payload);
    }
}
