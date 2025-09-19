package com.AIce.Backend.service;

import com.AIce.Backend.auth.exception.NotFoundUserException;
import com.AIce.Backend.chat.dto.ChatMessageResponse;
import com.AIce.Backend.chat.dto.ChatRoomResponse;
import com.AIce.Backend.chat.exception.NotFoundChatRoomException;
import com.AIce.Backend.chat.service.ChatRoomService;
import com.AIce.Backend.domain.chat.entity.ChatRoom;
import com.AIce.Backend.domain.user.entity.User;
import com.AIce.Backend.domain.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.*;
import java.time.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ChatRoomServiceTest {

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(new User("tester", "encodedPassword", "name"));
    }

    @Test
    @DisplayName("방 생성 성공")
    void createRoom_success() {
        ChatRoomResponse response = chatRoomService.createRoom(testUser.getUserId());

        assertNotNull(response);
        assertEquals("New Chat", response.getTitle());
    }

    @Test
    @DisplayName("방 생성 실패 - 존재하지 않는 유저")
    void createRoom_fail_userNotFound() {
        assertThrows(NotFoundUserException.class,
                () -> chatRoomService.createRoom(999L));
    }

    @Test
    @DisplayName("방 조회 성공")
    void getRoom_success() {
        ChatRoomResponse created = chatRoomService.createRoom(testUser.getUserId());
        ChatRoomResponse found = chatRoomService.getRoom(created.getChatRoomId(), testUser.getUserId());

        assertEquals(created.getChatRoomId(), found.getChatRoomId());
    }

    @Test
    @DisplayName("방 조회 실패 - 다른 유저 접근")
    void getRoom_fail_otherUser() {
        ChatRoomResponse created = chatRoomService.createRoom(testUser.getUserId());

        User otherUser = userRepository.save(new User("other", "encodedPassword2", "name2"));

        assertThrows(NotFoundChatRoomException.class,
                () -> chatRoomService.getRoom(created.getChatRoomId(), otherUser.getUserId()));
    }

    @Test
    @DisplayName("방 제목 수정 성공")
    void updateRoom_success() {
        ChatRoomResponse created = chatRoomService.createRoom(testUser.getUserId());
        chatRoomService.updateRoom(testUser.getUserId(), created.getChatRoomId(), "Renamed Chat");

        ChatRoomResponse updated = chatRoomService.getRoom(created.getChatRoomId(), testUser.getUserId());
        assertEquals("Renamed Chat", updated.getTitle());
    }

    @Test
    @DisplayName("방 제목 수정 실패 - 빈 문자열")
    void updateRoom_fail_emptyTitle() {
        ChatRoomResponse created = chatRoomService.createRoom(testUser.getUserId());
        chatRoomService.updateRoom(testUser.getUserId(), created.getChatRoomId(), "   ");

        ChatRoomResponse updated = chatRoomService.getRoom(created.getChatRoomId(), testUser.getUserId());
        assertEquals("New Chat", updated.getTitle()); // 기존 제목 유지
    }

    @Test
    @DisplayName("방 삭제 성공")
    void deleteRoom_success() {
        ChatRoomResponse created = chatRoomService.createRoom(testUser.getUserId());
        chatRoomService.deleteRoom(testUser.getUserId(), created.getChatRoomId());

        assertThrows(NotFoundChatRoomException.class, () ->
                chatRoomService.getRoom(created.getChatRoomId(), testUser.getUserId()));
    }

    @Test
    @DisplayName("방 삭제 실패 - 없는 방")
    void deleteRoom_fail_notFound() {
        UUID fakeId = UUID.randomUUID();
        assertThrows(NotFoundChatRoomException.class,
                () -> chatRoomService.deleteRoom(testUser.getUserId(), fakeId));
    }

    @Test
    @DisplayName("메시지 조회 성공")
    void listMyMessages_success() {
        ChatRoomResponse room = chatRoomService.createRoom(testUser.getUserId());
        List<ChatMessageResponse> messages = chatRoomService.listMyMessages(testUser.getUserId(), room.getChatRoomId());

        assertNotNull(messages);
        assertTrue(messages.isEmpty()); // 초기에는 비어있음
    }

    @Test
    @DisplayName("접근 권한 확인 성공/실패")
    void hasAccessToRoom_test() {
        ChatRoomResponse room = chatRoomService.createRoom(testUser.getUserId());

        assertTrue(chatRoomService.hasAccessToRoom(testUser.getUserId(), room.getChatRoomId().toString()));

        User otherUser = userRepository.save(new User("other", "encodedPassword2", "name2"));

        assertFalse(chatRoomService.hasAccessToRoom(otherUser.getUserId(), room.getChatRoomId().toString()));
    }
}
