package com.AIce.Backend.global.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public enum PreferredTone {
    NEUTRAL ("neutral",  "기본형",  "특별한 말투 없이 일반적인 AI 스타일 🧠"),
    FRIENDLY("friendly", "친근한",  "다정하고 따뜻한 느낌, 이모지도 사용 😊"),
    POLITE  ("polite",   "정중한",  "공손하고 격식 있는 존댓말 위주 💼"),
    CHEERFUL("cheerful", "유쾌한",  "활기차고 명랑한 말투, 가벼운 농담도 가능 😄"),
    CALM    ("calm",     "차분한",  "침착하고 담백한 표현, 감정 표현 최소 🌙"),
    CYNICAL  ("cynical", "냉소적인", "비꼬고 빈정대는 말투, 가볍게 도발하거나 삐딱한 농담 😏");

    private final String slug;
    private final String koName;
    private final String description;

    PreferredTone(String slug, String koName, String description) {
        this.slug = slug;
        this.koName = koName;
        this.description = description;
    }

    @JsonValue
    public String getSlug() {
        return slug;
    }
    public String getKoName() {
        return koName;
    }
    public String getDescription() {
        return description;
    }

    private static final Map<String, PreferredTone> LOOKUP =
            Stream.of(values()).collect(Collectors.toUnmodifiableMap(
                    t -> t.slug, t -> t
            ));

    @JsonCreator
    public static PreferredTone fromJson(String value) {
        return fromSlug(value);
    }

    public static PreferredTone fromSlug(String value) {
        if (value == null || value.isBlank()) return null;
        PreferredTone t = LOOKUP.get(value.toLowerCase(Locale.ROOT));
        if (t == null) {
            throw new IllegalArgumentException("Unknown preferred_tone: " + value);
        }
        return t;
    }

    /** JPA: enum ↔ VARCHAR 매핑 */
    @Converter(autoApply = false)
    public static class JpaConverter implements AttributeConverter<PreferredTone, String> {
        @Override
        public String convertToDatabaseColumn(PreferredTone attribute) {
            return attribute == null ? null : attribute.getSlug();
        }
        @Override
        public PreferredTone convertToEntityAttribute(String dbData) {
            return fromSlug(dbData);
        }
    }
}