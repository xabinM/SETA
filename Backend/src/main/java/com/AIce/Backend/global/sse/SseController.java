package com.AIce.Backend.global.sse;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/sse")
public class SseController {
    private final SseHub hub;

    @GetMapping(value = "/chat/{roomId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@PathVariable String roomId) {
        return hub.subscribe(roomId);
    }

    @GetMapping(value="/metrics/live", produces=MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter metrics() {
        return hub.subscribe("metrics");
    }
}