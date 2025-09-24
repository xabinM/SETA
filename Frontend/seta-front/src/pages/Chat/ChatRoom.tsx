// src/pages/Chat/ChatRoom.tsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getRoomMessages, type UIMsg /* , sendMessageToServer */ } from "@/features/chat/api";
import { issueStreamCookie } from "@/features/auth/api";

const BASE = import.meta.env.VITE_API_BASE_URL as string;

type StreamStatus = "streaming" | "done" | "error";

export default function ChatRoom() {
    const { threadId } = useParams<{ threadId?: string }>();

    const [messages, setMessages] = useState<UIMsg[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [input, setInput] = useState("");
    const [ime, setIme] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    // 스트리밍 관련 (다음 단계에서 사용)
    const [isStreaming, setIsStreaming] = useState(false);
    const streamRef = useRef<EventSource | null>(null);
    const assistantIdRef = useRef<string | null>(null);

    // /chat에서 전달된 첫 질문(시드)
    const [pendingSeed, setPendingSeed] = useState<string | null>(null);
    const seedInjectedRef = useRef(false); // 중복 주입 방지

    // --- SSE 열기 함수 (쿠키로 인증) ---
    function openRoomStream(roomId: string) {
        // 기존 연결 있으면 닫기
        streamRef.current?.close();
        streamRef.current = null;

        const es = new EventSource(`${BASE}/sse/chat/${roomId}`, {
            withCredentials: true, // ★ 쿠키 인증 필수
        });
        streamRef.current = es;

        // 서버가 skeleton을 보낼 수도 있으나, 지금은 무시해도 됨(다음 단계에서 프론트 스켈레톤 생성)
        es.addEventListener("skeleton", (ev) => {
            // console.log("skeleton:", ev.data);
        });

        es.addEventListener("delta", (ev) => {
            // 아직 스켈레톤/append를 안 붙였으므로 콘솔로만 확인
            console.log("delta:", ev.data);
        });

        es.addEventListener("done", (ev) => {
            console.log("done:", ev.data);
            setIsStreaming(false);
        });

        es.addEventListener("error", (e) => {
            console.warn("SSE error", e);
            setIsStreaming(false);
        });

        return es;
    }

    // 시드 수거
    useEffect(() => {
        if (!threadId) return;
        const key = `seta:seed:${threadId}`;
        const seed = sessionStorage.getItem(key);
        if (seed) {
            setPendingSeed(seed);
            sessionStorage.removeItem(key);
            seedInjectedRef.current = false;
        } else {
            setPendingSeed(null);
            seedInjectedRef.current = true; // 시드 없음
        }
    }, [threadId]);

    // 히스토리 로드 (+ 시드가 있으면 일단 목록에 표시만)
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

                if (pendingSeed && !seedInjectedRef.current) {
                    const seedMsg: UIMsg = {
                        id: `u-seed-${Date.now()}`,
                        role: "user",
                        content: pendingSeed,
                        createdAt: new Date().toISOString(),
                    };
                    next = [...data, seedMsg];
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

    // 리스트 스크롤 항상 하단
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loading]);

    // ✅ 방 진입 시: 쿠키 심고 → SSE 연결
    useEffect(() => {
        if (!threadId) return;

        const ac = new AbortController();

        (async () => {
            try {
                // 1) SSE 전용 쿠키 발급 (Bearer → HttpOnly 쿠키)
                await issueStreamCookie(ac.signal);
            } catch (e) {
                // 실패해도 서버 정책에 따라 SSE가 열릴 수 있으니 일단 시도
                console.warn("issueStreamCookie failed (will try SSE anyway)", e);
            } finally {
                // 2) SSE 연결
                openRoomStream(threadId);
            }
        })();

        // 방 이동/언마운트 시 정리
        return () => {
            ac.abort();
            streamRef.current?.close();
            streamRef.current = null;
        };
    }, [threadId]);

    // 전송 (다음 단계에서 스켈레톤 생성/서버 POST 연동 추가할 예정)
    const send = () => {
        const text = input.trim();
        if (!text) return;
        const msg: UIMsg = {
            id: `u-${Date.now()}`,
            role: "user",
            content: text,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        setInput("");
    };

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
                        placeholder="메시지를 입력하세요…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        onCompositionStart={() => setIme(true)}
                        onCompositionEnd={() => setIme(false)}
                    />
                    <button className="send-btn" aria-label="send" onClick={send}>
                        <span className="material-icons">send</span>
                    </button>
                </div>
                <div className="chat-disclaimer">SETA는 실수를 할 수 있습니다. 중요한 정보는 검증해 주세요.</div>
            </div>
        </>
    );
}
