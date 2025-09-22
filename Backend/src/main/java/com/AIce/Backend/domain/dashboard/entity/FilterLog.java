//package com.AIce.Backend.domain.dashboard.entity;
//
//import lombok.*;
//import org.springframework.data.annotation.Id;
//import org.springframework.data.elasticsearch.annotations.Document;
//import org.springframework.data.elasticsearch.annotations.Field;
//import org.springframework.data.elasticsearch.annotations.FieldType;
//
//import java.time.OffsetDateTime;
//
//@Getter @Setter
//@Builder
//@NoArgsConstructor @AllArgsConstructor
//@Document(indexName = "filter-logs")
//public class FilterLog {
//
//    @Id
//    private String trace_id;
//
//    @Field(type = FieldType.Keyword)
//    private String user_id;
//
//    @Field(type = FieldType.Keyword)
//    private String dropped_text;
//
//    @Field(type = FieldType.Keyword)
//    private String reason_type;
//
//    @Field(type = FieldType.Date)
//    private OffsetDateTime created_at;
//}
//
