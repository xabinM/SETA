package com.AIce.Backend.dashboard.dto;

import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopDroppedTextDto {
    private String droppedText;
    private Long count;

    public static TopDroppedTextDto from(StringTermsBucket bucket) {
        return TopDroppedTextDto.builder()
                .droppedText(bucket.key().stringValue())
                .count(bucket.docCount())
                .build();
    }
}

