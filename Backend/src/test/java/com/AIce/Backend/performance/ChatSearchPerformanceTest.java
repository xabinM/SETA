package com.AIce.Backend.performance;

import com.AIce.Backend.domain.chat.entity.ChatMessage;
import com.AIce.Backend.domain.chat.entity.ChatRoom;
import com.AIce.Backend.domain.chat.repository.ChatMessageRepository;
import com.AIce.Backend.domain.user.entity.User;
import com.AIce.Backend.global.enums.ChatMessageRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StopWatch;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootTest
@ActiveProfiles("local2")
public class ChatSearchPerformanceTest {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    @DisplayName("LIKE 검색과 FTS 검색 성능 비교")
    @Sql("/fts-index.sql") // 인덱스 생성 스크립트 실행 보장
    @Transactional
    void testSearchPerformanceComparison() {
        // 1. 데이터 준비 (100,000건)
        createDummyData(100000);

        entityManager.flush();
        entityManager.clear();

        StopWatch stopWatch = new StopWatch();

        // 2. LIKE 검색 실행
        stopWatch.start("LIKE Search (Full Scan)");
        List<ChatMessage> likeResults = chatMessageRepository.findByContentContaining("Spring");
        stopWatch.stop();

        // 3. FTS 검색 실행
        String ftsKeyword = "Spring & Framework";
        stopWatch.start("Full-Text Search (GIN Index)");
        List<ChatMessage> ftsResults = chatMessageRepository.searchByFullText(ftsKeyword);
        stopWatch.stop();

        // 4. 결과 출력
        System.out.println("=== 검색 성능 비교 ===");
        System.out.println("LIKE 검색 결과 수: " + likeResults.size());
        System.out.println("FTS 검색 결과 수: " + ftsResults.size());
        System.out.println(stopWatch.prettyPrint());
        System.out.println("====================");
    }

    @Test
    @DisplayName("LIKE와 FTS의 실행 계획 비교")
    @Sql("/fts-index.sql") // 인덱스 생성 스크립트 실행 보장
    @Transactional
    void testSearchExecutionPlan() {
        createDummyData(100000); // 10만건 유지
        entityManager.flush();
        entityManager.clear();

        // --- LIKE 쿼리 실행 계획 ---
        System.out.println("--- EXPLAIN ANALYZE for LIKE query ---");
        String likeQuery = "EXPLAIN ANALYZE SELECT * FROM chat_message WHERE content LIKE '%Spring%'";
        List<String> likePlan = entityManager.createNativeQuery(likeQuery, String.class).getResultList();
        likePlan.forEach(System.out::println);
        System.out.println("------------------------------------");

        // --- FTS 쿼리 실행 계획 ---
        System.out.println("\n--- EXPLAIN ANALYZE for FTS query ---");
        String ftsKeyword = "Spring & Framework";
        String ftsQuery = String.format(
            "EXPLAIN ANALYZE SELECT * FROM chat_message WHERE to_tsvector('english', content) @@ to_tsquery('english', '%s')",
            ftsKeyword
        );
        List<String> ftsPlan = entityManager.createNativeQuery(ftsQuery, String.class).getResultList();
        ftsPlan.forEach(System.out::println);
        System.out.println("-----------------------------------");
    }

    private void createDummyData(int count) {
        User user = new User("searchUser", "password", "Search Tester");
        entityManager.persist(user);

        ChatRoom chatRoom = ChatRoom.builder()
                .user(user)
                .title("Search Test Room")
                .build();
        entityManager.persist(chatRoom);

        for (int i = 0; i < count; i++) {
            String content = "This is a test message number " + i;
            if (i % 100 == 0) {
                content += " with Spring Framework keyword."; // 100건마다 키워드 포함
            }

            ChatMessage msg = ChatMessage.builder()
                    .chatRoom(chatRoom)
                    .user(user)
                    .role(ChatMessageRole.user)
                    .content(content)
                    .createdAt(LocalDateTime.now())
                    .build();
            entityManager.persist(msg);
        }
    }
}
