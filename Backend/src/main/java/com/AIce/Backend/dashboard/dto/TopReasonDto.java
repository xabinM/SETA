package com.AIce.Backend.dashboard.dto;

import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopReasonDto {
    private String reasonType;
    private Long count;

    public static TopReasonDto from(StringTermsBucket bucket) {
        return TopReasonDto.builder()
                .reasonType(bucket.key().stringValue())
                .count(bucket.docCount())
                .build();
    }
}
