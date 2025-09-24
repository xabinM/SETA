// src/pages/Chat/ChatRoom.tsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getRoomMessages, type UIMsg /* , sendMessageToServer */ } from "@/features/chat/api";

export default function ChatRoom() {
    const { threadId } = useParams<{ threadId?: string }>();
    const [messages, setMessages] = useState<UIMsg[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [ime, setIme] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    // 🔹 1) pendingSeed: /chat에서 전달된 첫 메시지(시드)를 먼저 확보
    const [pendingSeed, setPendingSeed] = useState<string | null>(null);
    const seedInjectedRef = useRef(false); // 중복 주입 방지

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

    // 🔹 2) 히스토리 로드 + (있다면) pendingSeed를 합쳐서 setMessages
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

                    // TODO: 서버에도 실제 전송하려면 여기에 호출
                    // await sendMessageToServer(threadId, pendingSeed).catch(console.error);
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

    // 🔹 3) 스크롤 항상 하단
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loading]);

    // 🔹 4) 일반 전송
    const send = () => {
        const text = input.trim();
        if (!text) return;
        const msg: UIMsg = {
            id: `u-${Date.now()}`,
            role: "user",
            content: text,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, msg]);
        setInput("");

        // TODO: 서버 전송 연동 시
        // if (threadId) sendMessageToServer(threadId, text).catch(console.error);
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
