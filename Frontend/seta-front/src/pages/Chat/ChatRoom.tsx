// src/pages/Chat/ChatRoom.tsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getRoomMessages, sendMessageToServer, type UIMsg } from "@/features/chat/api";
import { issueStreamCookie } from "@/features/auth/api";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const BASE = RAW_BASE.replace(/\/+$/, "");

// ===== 튜닝 파라미터 =====
const BACKOFF_BASE_MS = 600;       // 초기 지연
const BACKOFF_MAX_MS  = 20_000;    // 최대 지연
const IDLE_TIMEOUT_MS = 45_000;    // 이 시간 동안 아무 이벤트 없으면 재연결
const HEARTBEAT_NAMES = new Set(["ping", "heartbeat"]); // 서버 하트비트 이벤트

type StreamStatus = "idle" | "streaming" | "done" | "error";

export default function ChatRoom() {
    const { threadId } = useParams<{ threadId?: string }>();

    const [messages, setMessages] = useState<UIMsg[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [input, setInput] = useState("");
    const [ime, setIme] = useState(false);
    const [status, setStatus] = useState<StreamStatus>("idle");

    const scrollRef = useRef<HTMLDivElement | null>(null);

    // ===== SSE 상태 관리 =====
    const esRef = useRef<EventSource | null>(null);
    const connectingRef = useRef(false);
    const assistantIdRef = useRef<string | null>(null);

    const abortedRef = useRef(false);
    const reconnectTimerRef = useRef<number | null>(null);
    const idleTimerRef = useRef<number | null>(null);
    const lastEventAtRef = useRef<number>(Date.now());
    const attemptRef = useRef(0); // 재연결 횟수

    // /chat에서 전달된 첫 질문(시드)
    const [pendingSeed, setPendingSeed] = useState<string | null>(null);
    const seedInjectedRef = useRef(false); // UI 주입 중복 방지
    const seedSentRef = useRef(false);     // 실제 서버 전송 1회 보장

    /* ------------------ seed pickup ------------------ */
    useEffect(() => {
        if (!threadId) return;
        const key = `seta:seed:${threadId}`;
        const seed = sessionStorage.getItem(key);
        if (seed) {
            setPendingSeed(seed);
            sessionStorage.removeItem(key);
            seedInjectedRef.current = false;
            seedSentRef.current = false;
        } else {
            setPendingSeed(null);
            seedInjectedRef.current = true;
            seedSentRef.current = true;
        }
    }, [threadId]);

    /* ------------------ history load ------------------ */
    useEffect(() => {
        if (!threadId) return;
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getRoomMessages(threadId);
                if (!alive) return;

                let next = data;
                // 시드가 있으면 UI에만 먼저 보여주기 (실제 전송은 mount-effect에서 1회)
                if (pendingSeed && !seedInjectedRef.current) {
                    next = [
                        ...data,
                        {
                            id: `u-seed-${Date.now()}`,
                            role: "user",
                            content: pendingSeed,
                            createdAt: new Date().toISOString(),
                        },
                    ];
                    seedInjectedRef.current = true;
                }
                setMessages(next);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "대화 불러오기 실패";
                setError(msg);
                setMessages([]);
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [threadId, pendingSeed]);

    /* ------------------ autoscroll ------------------ */
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loading, status]);

    /* ------------------ 유틸 ------------------ */
    function clearTimer(ref: React.MutableRefObject<number | null>) {
        if (ref.current) {
            window.clearTimeout(ref.current);
            ref.current = null;
        }
    }
    function resetIdleWatchdog() {
        lastEventAtRef.current = Date.now();
        clearTimer(idleTimerRef);
        idleTimerRef.current = window.setTimeout(() => {
            if (abortedRef.current) return;
            // 일정 시간 이벤트가 없으면 연결 재생성
            console.warn("SSE idle watchdog: no events for", IDLE_TIMEOUT_MS, "→ reconnect");
            safeReconnect();
        }, IDLE_TIMEOUT_MS);
    }
    function backoffDelay(attempt: number) {
        const cap = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempt);
        const jitter = Math.random() * 0.25 + 0.75; // 0.75x ~ 1.0x
        return Math.floor(cap * jitter);
    }

    /* ------------------ SSE Handlers ------------------ */
    function attachSseHandlers(es: EventSource) {
        // 모든 이벤트에서 워치독 리셋
        es.onmessage = () => resetIdleWatchdog();

        // skeleton: 서버가 message_id 내려줌
        es.addEventListener("skeleton", (ev) => {
            resetIdleWatchdog();
            const d = safeJSON<{ message_id?: string; id?: string }>((ev as MessageEvent).data);
            const draftId = d?.message_id ?? d?.id ?? `a-${Date.now()}`;
            assistantIdRef.current = draftId;
            setStatus("streaming");
            setMessages((prev) => [
                ...prev,
                { id: draftId, role: "assistant", content: "", createdAt: new Date().toISOString() },
            ]);
        });

        // delta: 서버가 delta 문자열을 내려줌
        es.addEventListener("delta", (ev) => {
            resetIdleWatchdog();
            const d = safeJSON<{ delta?: string; message_id?: string }>((ev as MessageEvent).data);
            const chunk = d?.delta ?? "";
            if (!chunk) return;

            const targetId = assistantIdRef.current ?? d?.message_id ?? null;
            setMessages((prev) => {
                const next = [...prev];
                // skeleton 없이 delta가 먼저 와도 안전하게 생성
                let idx = next.findIndex((m) => m.role === "assistant" && (!targetId || m.id === targetId));
                if (idx === -1) {
                    const draftId = targetId ?? `a-${Date.now()}`;
                    assistantIdRef.current = draftId;
                    next.push({ id: draftId, role: "assistant", content: "", createdAt: new Date().toISOString() });
                    idx = next.length - 1;
                }
                next[idx] = { ...next[idx], content: (next[idx].content || "") + chunk };
                return next;
            });
        });

        es.addEventListener("done", () => {
            resetIdleWatchdog();
            // 필요하면 message_id 확인: const d = safeJSON<{ message_id?: string }>((ev as MessageEvent).data);
            setStatus("done");
            assistantIdRef.current = null;
            // 서버/프록시가 닫으면 onerror로 떨어짐
        });

        // 서버 하트비트
        for (const name of HEARTBEAT_NAMES) {
            es.addEventListener(name, () => resetIdleWatchdog());
        }

        es.onerror = () => {
            console.warn("SSE onerror → schedule reconnect");
            safeReconnect();
        };
    }

    function openRoomStream(roomId: string) {
        if (connectingRef.current) return;
        connectingRef.current = true;

        // 기존 연결 정리
        esRef.current?.close();
        esRef.current = null;

        const url = `${BASE}/sse/chat/${encodeURIComponent(roomId)}`;
        const es = new EventSource(url, { withCredentials: true });
        esRef.current = es;

        attachSseHandlers(es);
        resetIdleWatchdog();

        attemptRef.current = 0; // 연결(최초 이벤트까지) 성공 가정
        connectingRef.current = false;
    }

    async function connectWithCookie(roomId: string) {
        // 쿠키 발급 실패 시 연결하지 않음 (403 루프 방지)
        await issueStreamCookie();
        openRoomStream(roomId);
    }

    function safeReconnect() {
        if (abortedRef.current) return;
        if (reconnectTimerRef.current) return; // 중복 스케줄 방지

        // 재연결 전에 현재 연결 종료
        esRef.current?.close();
        esRef.current = null;

        const delay = backoffDelay(attemptRef.current++);
        reconnectTimerRef.current = window.setTimeout(async () => {
            reconnectTimerRef.current = null;
            if (abortedRef.current || !threadId) return;

            try {
                // 몇 번에 한 번은 쿠키도 재발급 (예: 3회마다)
                if (attemptRef.current % 3 === 1) {
                    await issueStreamCookie();
                }
                openRoomStream(threadId);
            } catch (e) {
                console.error("reconnect cookie failed:", e);
                safeReconnect(); // 다음 백오프로 이어가기
            }
        }, delay);
    }

    /* ------------------ mount: cookie → SSE → seed send ------------------ */
    useEffect(() => {
        if (!threadId) return;
        abortedRef.current = false;

        (async () => {
            try {
                await connectWithCookie(threadId); // 1) 쿠키 심고 2) 연결
                if (pendingSeed && !seedSentRef.current) {
                    await sendMessageToServer(threadId, pendingSeed); // 3) seed 실제 전송 1회
                    setStatus("streaming");
                    seedSentRef.current = true;
                }
            } catch (e) {
                console.error("stream cookie failed:", e);
                setError("스트림 쿠키 발급 실패(403). 다시 로그인 후 재시도해주세요.");
                return;
            }
        })();

        // 온라인/오프라인 & 탭가시성 이벤트로 노이즈 줄이기
        const onOnline = () => safeReconnect();
        const onVisibility = () => {
            if (document.visibilityState === "visible") safeReconnect();
        };
        window.addEventListener("online", onOnline);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            abortedRef.current = true;
            window.removeEventListener("online", onOnline);
            document.removeEventListener("visibilitychange", onVisibility);
            clearTimer(reconnectTimerRef);
            clearTimer(idleTimerRef);
            esRef.current?.close();
            esRef.current = null;
            assistantIdRef.current = null;
            setStatus("idle");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threadId]);

    const sendingLocked = status === "streaming";

    /* ------------------ send ------------------ */
    async function send() {
        const text = input.trim();
        if (!threadId || !text || sendingLocked) return;

        // 로컬에 유저 메시지 먼저 반영
        setMessages((prev) => [
            ...prev,
            { id: `u-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() },
        ]);
        setInput("");
        setStatus("streaming");
        try {
            await sendMessageToServer(threadId, text);
            // 서버가 SSE로 skeleton→delta→done push
        } catch (e) {
            setStatus("error");
            console.error(e);
        }
    }

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (ime) return;
        if (e.key === "Enter") send();
    };

    return (
        <>
            <div className="messages" ref={scrollRef}>
                {loading ? (
                    <div style={{ opacity: 0.6, textAlign: "center", marginTop: 24 }}>히스토리 불러오는 중…</div>
                ) : error ? (
                    <div style={{ opacity: 0.85, color: "#f66", textAlign: "center", marginTop: 24 }}>{error}</div>
                ) : messages.length === 0 ? (
                    <div style={{ opacity: 0.6, textAlign: "center", marginTop: 24 }}>
                        아직 메시지가 없어요. 아래 입력창에 메시지를 입력해보세요.
                    </div>
                ) : (
                    messages.map((m) => (
                        <div key={m.id} className={`msg ${m.role}`}>
                            <div className="bubble">{m.content}</div>
                        </div>
                    ))
                )}
            </div>

            <div className="chat-footer">
                <div className="chat-input-container">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder={sendingLocked ? "답변 생성 중… (잠시만)" : "메시지를 입력하세요…"}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        disabled={sendingLocked}
                        onCompositionStart={() => setIme(true)}
                        onCompositionEnd={() => setIme(false)}
                    />
                    <button className="send-btn" aria-label="send" onClick={send} disabled={sendingLocked}>
                        <span className="material-icons">send</span>
                    </button>
                </div>
                <div className="chat-disclaimer">SETA는 실수를 할 수 있습니다. 중요한 정보는 검증해 주세요.</div>
            </div>
          </>
    );
}

/* ------------------ utils ------------------ */
function safeJSON<T = unknown>(data: unknown): T | null {
    try {
        return typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
    } catch {
        return null;
    }
}