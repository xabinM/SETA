package com.AIce.Backend.chat.client;

import com.AIce.Backend.global.config.gms.GmsOpenAiProperties;
import com.AIce.Backend.global.dto.ChatCompletionRequest;
import com.AIce.Backend.global.dto.ChatCompletionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TitleSummarizerClient {
    private final WebClient gmsOpenAiWebClient;
    private final GmsOpenAiProperties props;

    public Optional<String> summarizeToTitle(String firstUserMessage) {
        String developer = "너는 채팅방 제목 생성기야. 한국어/영어, 18자 이내, 마침표/따옴표/이모지/개인정보 금지.";
        String user = "다음 메시지를 한 줄 제목으로: \"" + firstUserMessage + "\"";

        long start = System.currentTimeMillis();
        ChatCompletionRequest req = ChatCompletionRequest.builder()
                .model(props.getModel())
                .messages(List.of(
                        ChatCompletionRequest.Message.builder().role("developer").content(developer).build(),
                        ChatCompletionRequest.Message.builder().role("user").content(user).build()
                ))
                .build();

        try {
            ChatCompletionResponse res = gmsOpenAiWebClient.post()
                    .uri(props.getCompletionsPath())
                    .bodyValue(req)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, resp ->
                            resp.bodyToMono(String.class).defaultIfEmpty("")
                                    .flatMap(body -> {
                                        log.warn("GMS chat.completions error status={} body={}", resp.statusCode(), body);
                                        return Mono.error(new RuntimeException("GMS error " + resp.statusCode()));
                                    })
                    )
                    .bodyToMono(ChatCompletionResponse.class)
                    .timeout(Duration.ofMillis(props.getTimeoutMs() + 500))
                    .doOnError(e -> log.warn("GMS call failed after {}ms: {}", System.currentTimeMillis()-start, e.toString()))
                    .block();

            if (res == null || res.getChoices() == null || res.getChoices().isEmpty()) {
                log.info("GMS returned empty choices");
                return Optional.empty();
            }
            String title = res.getChoices().get(0).getMessage().getContent();
            title = sanitize(title);
            if (title.isBlank())
                return Optional.empty();
            title = truncate(title, 18);
            log.info("GMS title OK ({}ms): {}", System.currentTimeMillis()-start, title);
            return Optional.of(title);
        } catch (Exception e) {
            log.warn("GMS summarize failed ({}ms). Fallback will be used. cause={}",
                    System.currentTimeMillis()-start, e.toString());
            return Optional.empty();
        }
    }

    // 기호 제거 
    private String sanitize(String s) {
        String t = s == null ? "" : s;
        t = t.replaceAll("[\"'`“”‘’·•…~!?💬🔥⭐🌟✨💡🎯🚀⚡️⛰️🌊🧠💻📊📝]", "");
        t = t.replaceAll("\\s+", " ").trim();
        return t;
    }
    // 글자수 18자 제한
    private String truncate(String s, int max) { return s.length() <= max ? s : s.substring(0, max); }
}
