package com.AIce.Backend.chat.service;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import com.AIce.Backend.domain.chat.entity.ChatRoom;
import com.AIce.Backend.domain.chat.repository.ChatMessageRepository;
import com.AIce.Backend.chat.adapter.messaging.kafka.ChatKafkaProducer;
import com.AIce.Backend.chat.contracts.*;
import com.AIce.Backend.domain.chat.repository.ChatRoomRepository;
import com.AIce.Backend.domain.user.repository.UserRepository;
import com.AIce.Backend.domain.usersetting.entity.UserSetting;
import com.AIce.Backend.domain.usersetting.repository.UserSettingRepository;
import com.AIce.Backend.global.enums.ChatMessageRole;
import com.AIce.Backend.global.sse.SseHub;
import io.micrometer.observation.annotation.Observed;
import io.micrometer.tracing.Tracer;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final Tracer tracer;
    private final ChatMessageRepository chatMessagerepo;
    private final ChatRoomRepository chatRoomrepo;
    private final UserRepository userrepo;
    private final UserSettingRepository userSettingrepo;
    private final ChatKafkaProducer producer;
    private final ChatRoomTitleService chatRoomTitleService;
    private final DropResponder dropResponder;
    private final StringRedisTemplate redisTemplate;
    private final SseHub hub;

    private static final String TURN_KEY_PREFIX = "chat:turn:";

    @Observed(name = "chat.handleUserMessage")
    @Transactional
    public void handleUserMessage(String roomId, Long userId, String text) {
        String traceId = tracer.currentSpan().context().traceId();
        UUID roomUuid = UUID.fromString(roomId);
        log.info("[HandleMessage] roomId={} userId={} traceId={} text='{}'",
                roomId, userId, traceId, text);
        ChatRoom room = chatRoomrepo.findById(roomUuid)
                .orElseThrow(() -> new IllegalArgumentException("chat room not found: " + roomUuid));

        // turn 계산
        int turnIdx = getNextTurnIndexForUser(room.getChatRoomId());
        log.debug("[HandleMessage] roomId={} turnIdx={}", roomId, turnIdx);

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
        chatMessagerepo.saveAndFlush(entity);

        if (turnIdx == 1) {
            log.info("[HandleMessage] trigger title update for roomId={}", roomId);
            // 요약 비동기 + 타임아웃 + 폴백 처리
//            chatRoomTitleService.tryUpdateTitleAsync(roomUuid, text);
        }

        // raw 발행
        log.debug("[HandleMessage] publishing raw to Kafka traceId={} roomId={}", traceId, roomId);

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

        // skeleton 먼저 전송: 응답 처리 시작 신호
        hub.push(roomId, "skeleton",
                Map.of("role", "assistant",
                        "content", "",
                        "turnIndex", turnIdx));
    }

    @Transactional
    public void persistAssistantFromLlm(LlmAnswerDoneV1 out) {
        UUID roomId = UUID.fromString(out.getRoom_id());
        ChatRoom room = chatRoomrepo.findByChatRoomId(roomId);

        // user 메시지의 messageId 기반으로 turnIndex 찾아오기
        UUID userMsgId = UUID.fromString(out.getMessage_id());
        ChatMessage userMessage = chatMessagerepo.findById(userMsgId)
                .orElseThrow(() -> new IllegalArgumentException("user message not found: " + userMsgId));
        int turnIndex = userMessage.getTurnIndex();

        String content = Optional.ofNullable(out.getResponse())
                .map(LlmAnswerDoneV1.Response::getText)
                .orElse("");

        chatMessagerepo.save(ChatMessage.builder()
            .chatRoom(room)
            .user(room.getUser())
            .role(ChatMessageRole.valueOf("assistant"))
            .content(content)
            .filteredContent(null)
            .externalId(out.getTrace_id())
            .turnIndex(turnIndex)
            .build());
    }

    @Transactional
    public String persistAssistantFromLlm(FilterResultV1 out) {
        UUID roomId = UUID.fromString(out.getRoom_id());
        ChatRoom room = chatRoomrepo.findByChatRoomId(roomId);
        Optional<UserSetting> us = userSettingrepo.findByUser_UserId(room.getUser().getUserId());
        String text = dropResponder.buildText(out, us);
        String content = text != null ? text : "";

        // user 메시지의 messageId 기반으로 turnIndex 찾아오기
        UUID userMsgId = UUID.fromString(out.getMessage_id());
        ChatMessage userMessage = chatMessagerepo.findById(userMsgId)
                .orElseThrow(() -> new IllegalArgumentException("user message not found: " + userMsgId));
        int turnIndex = userMessage.getTurnIndex();

        chatMessagerepo.save(ChatMessage.builder()
                .chatRoom(room)
                .user(room.getUser())
                .role(ChatMessageRole.valueOf("assistant"))
                .content(content)
                .filteredContent(null)
                .externalId(out.getTrace_id())
                .turnIndex(turnIndex)
                .build());

        return content;
    }

    // === Turn Index Util ===
    private int getNextTurnIndexForUser(UUID roomId) {
        String key = TURN_KEY_PREFIX + roomId;

        // Redis에 값 없으면 DB에서 조회
        if (!redisTemplate.hasKey(key)) {
            int maxTurn = chatMessagerepo.findMaxTurnIndex(roomId);
            // DB 값이 0이면 아직 메시지 없음 → 0 저장
            redisTemplate.opsForValue().set(key, String.valueOf(maxTurn));
        }

        // User 메시지는 새로운 턴 시작 → INCR
        Long next = redisTemplate.opsForValue().increment(key);
        return next != null ? next.intValue() : 1;
    }
}
