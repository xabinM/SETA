package com.AIce.Backend.domain.chat.repository;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
}