package com.AIce.Backend.dashboard.service;

//import co.elastic.clients.elasticsearch.ElasticsearchClient;
//import co.elastic.clients.elasticsearch.core.SearchResponse;
//import com.AIce.Backend.dashboard.dto.TopDroppedTextDto;
//import com.AIce.Backend.dashboard.dto.TopReasonDto;
import com.AIce.Backend.domain.dashboard.entity.*;
import com.AIce.Backend.domain.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TokenStatsService {

    private final UserSavedTokenDailyRepository userSavedTokenDailyRepository;
    private final GlobalSavedTokenDailyRepository globalSavedTokenDailyRepository;
    private final UserSavedTokenTotalRepository userSavedTokenTotalRepository;
    private final GlobalSavedTokenTotalRepository globalSavedTokenTotalRepository;
//    private final ElasticsearchClient esClient;

    // 로그인한 유저의 최신 daily 통계
    public UserSavedTokenDaily getUserDaily(Long userId) {
        return userSavedTokenDailyRepository
                .findTopByUserIdOrderByWindowStartDesc(userId.toString())
                .orElse(null);
    }

    // 로그인한 유저의 최신 total 통계
    public UserSavedTokenTotal getUserTotal(Long userId) {
        return userSavedTokenTotalRepository
                .findTopByUserIdOrderByStatDateDesc(userId.toString())
                .orElse(null);
    }

    // 최신 글로벌 daily
    public GlobalSavedTokenDaily getGlobalDaily() {
        return globalSavedTokenDailyRepository
                .findTopByOrderByWindowStartDesc()
                .orElse(null);
    }

    // 최신 글로벌 total
    public GlobalSavedTokenTotal getGlobalTotal() {
        return globalSavedTokenTotalRepository
                .findTopByOrderByStatDateDesc()
                .orElse(null);
    }
//
//    // 특정 유저의 top dropped_text 5개
//    public List<TopDroppedTextDto> getTopDroppedTexts(Long userId) throws IOException {
//        SearchResponse<Void> response = esClient.search(s -> s
//                        .index("filter-logs")
//                        .size(0)
//                        .query(q -> q.term(t -> t.field("user_id").value(userId.toString())))
//                        .aggregations("top_dropped", a -> a
//                                .terms(t -> t.field("dropped_text").size(5))
//                        ),
//                Void.class
//        );
//
//        return response.aggregations()
//                .get("top_dropped")
//                .sterms()
//                .buckets()
//                .array()
//                .stream()
//                .map(TopDroppedTextDto::from)
//                .toList();
//    }
//
//    // 전체 기준 top reason_type 5개
//    public List<TopReasonDto> getTopReasons() throws IOException {
//        SearchResponse<Void> response = esClient.search(s -> s
//                        .index("filter-logs")
//                        .size(0)
//                        .aggregations("top_reasons", a -> a
//                                .terms(t -> t.field("reason_type").size(5))
//                        ),
//                Void.class
//        );
//
//        return response.aggregations()
//                .get("top_reasons")
//                .sterms()
//                .buckets()
//                .array()
//                .stream()
//                .map(TopReasonDto::from)
//                .toList();
//    }
}
