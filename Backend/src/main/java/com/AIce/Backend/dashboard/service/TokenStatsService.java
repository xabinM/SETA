package com.AIce.Backend.dashboard.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import com.AIce.Backend.dashboard.dto.TokenStatsResponse;
import com.AIce.Backend.dashboard.dto.TopDroppedTextDto;
import com.AIce.Backend.dashboard.dto.TopReasonDto;
import com.AIce.Backend.domain.dashboard.entity.*;
import com.AIce.Backend.domain.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TokenStatsService {

    private final UserSavedTokenDailyRepository userSavedTokenDailyRepository;
    private final GlobalSavedTokenDailyRepository globalSavedTokenDailyRepository;
    private final UserSavedTokenTotalRepository userSavedTokenTotalRepository;
    private final GlobalSavedTokenTotalRepository globalSavedTokenTotalRepository;
    private final ElasticsearchClient esClient;

    @Transactional(readOnly = true)
    public TokenStatsResponse getTokenStats(Long userId) throws IOException {
        var userTotal = userSavedTokenTotalRepository
                .findTopByUserIdOrderByStatDateDesc(userId.toString())
                .orElse(null);

        var userDaily = userSavedTokenDailyRepository
                .findTopByUserIdOrderByWindowStartDesc(userId.toString())
                .orElse(null);

        var globalDaily = globalSavedTokenDailyRepository
                .findTopByOrderByWindowStartDesc()
                .orElse(null);

        var globalTotal = globalSavedTokenTotalRepository
                .findTopByOrderByStatDateDesc()
                .orElse(null);

        var topDroppedTexts = getTopDroppedTexts(userId);
        var topReasons = getTopReasons();

        return TokenStatsResponse.from(
                userTotal, userDaily, globalDaily, globalTotal,
                topDroppedTexts, topReasons
        );
    }

    public List<TopDroppedTextDto> getTopDroppedTexts(Long userId) throws IOException {
        SearchResponse<Void> response = esClient.search(s -> s
                        .index("filter-logs")
                        .size(0)
                        .query(q -> q.term(t -> t.field("user_id").value(userId.toString())))
                        .aggregations("top_dropped", a -> a
                                .terms(t -> t.field("dropped_text").size(5))
                        ),
                Void.class
        );

        return response.aggregations()
                .get("top_dropped")
                .sterms()
                .buckets()
                .array()
                .stream()
                .map(TopDroppedTextDto::from)
                .toList();
    }

    public List<TopReasonDto> getTopReasons() throws IOException {
        SearchResponse<Void> response = esClient.search(s -> s
                        .index("filter-logs")
                        .size(0)
                        .aggregations("top_reasons", a -> a
                                .terms(t -> t.field("reason_type").size(5))
                        ),
                Void.class
        );

        return response.aggregations()
                .get("top_reasons")
                .sterms()
                .buckets()
                .array()
                .stream()
                .map(TopReasonDto::from)
                .toList();
    }
}
