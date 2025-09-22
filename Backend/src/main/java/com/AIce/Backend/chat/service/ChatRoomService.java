package com.AIce.Backend.chat.service;

import com.AIce.Backend.auth.exception.NotFoundUserException;
import com.AIce.Backend.chat.dto.ChatMessageResponse;
import com.AIce.Backend.chat.dto.ChatRoomResponse;
import com.AIce.Backend.chat.exception.NotFoundChatRoomException;
import com.AIce.Backend.domain.chat.entity.ChatMessage;
import com.AIce.Backend.domain.chat.entity.ChatRoom;
import com.AIce.Backend.domain.chat.repository.ChatMessageRepository;
import com.AIce.Backend.domain.chat.repository.ChatRoomRepository;
import com.AIce.Backend.domain.chat.repository.RoomSummaryStateRepository;
import com.AIce.Backend.domain.user.entity.User;
import com.AIce.Backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatRoomService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final RoomSummaryStateRepository roomSummaryStateRepository;

    @Transactional
    public ChatRoomResponse createRoom(Long userId) {
        User user = userRepository.findByUserId(userId);
        if (user == null) {
            throw new NotFoundUserException();
        }
        ChatRoom room = ChatRoom.builder()
                .user(userRepository.findByUserId(userId))
                .title("New Chat")
                .build();
        chatRoomRepository.save(room);

        // 요약 상태 초기화
        roomSummaryStateRepository.insertIfNotExist(room.getChatRoomId());

        return new ChatRoomResponse(room);
    }

    @Transactional(readOnly = true)
    public ChatRoomResponse getRoom(UUID roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findByChatRoomIdAndUser(roomId, userRepository.findByUserId(userId))
                .orElseThrow(() -> new NotFoundChatRoomException("ChatRoom not found"));
        return new ChatRoomResponse(room);
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponse> listMyRooms(Long userId) {
        List<ChatRoom> rooms = chatRoomRepository.findByUser(userRepository.findByUserId(userId))
                .orElse(Collections.emptyList());
        return rooms.stream()
                .map(ChatRoomResponse::from)
                .toList();
    }

    /* 채팅방 제목 수정용 */
    public void updateRoom(Long userId, UUID roomId, String title) {
        ChatRoom room = chatRoomRepository.findByChatRoomIdAndUser(roomId, userRepository.findByUserId(userId))
                .orElseThrow(() -> new NotFoundChatRoomException("ChatRoom not found"));
        if (title != null && !title.isBlank()) room.setTitle(title.trim());
    }

    @Transactional
    public void deleteRoom(Long userId, UUID roomId) {
        ChatRoom room = chatRoomRepository.findByChatRoomIdAndUser(roomId, userRepository.findByUserId(userId))
                .orElseThrow(() -> new NotFoundChatRoomException("ChatRoom not found"));
        chatMessageRepository.deleteAllByChatRoom_ChatRoomId(roomId);
        roomSummaryStateRepository.deleteByChatRoom_ChatRoomId(roomId);
        chatRoomRepository.delete(room);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> listMyMessages(Long userId, UUID roomId) {
        List<ChatMessage> messages = chatMessageRepository.findByChatRoom_ChatRoomIdAndUser_UserIdOrderByCreatedAtDesc(roomId, userId)
                .orElse(Collections.emptyList());
        return messages.stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    // 사용자가 해당 채팅방에 접근할 수 있는지 확인
    public boolean hasAccessToRoom(Long userId, String roomId) {
        return chatRoomRepository.existsByChatRoomIdAndUser_UserId(UUID.fromString(roomId), userId);
    }
}
