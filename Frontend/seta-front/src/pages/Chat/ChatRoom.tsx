import {useEffect, useMemo, useRef, useState, type HTMLAttributes, type AnchorHTMLAttributes, type MutableRefObject,} from "react";
import {createPortal} from "react-dom";
import {useParams} from "react-router-dom";
import {getRoomMessages, sendMessageToServer, type UIMsg} from "@/features/chat/api";
import {issueStreamCookie} from "@/features/auth/api";
import CustomToast from "@/ui/components/Toast/CustomToast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const BASE = RAW_BASE.replace(/\/+$/, "");

const BACKOFF_BASE_MS = 600;
const BACKOFF_MAX_MS = 20_000;
const IDLE_TIMEOUT_MS = 45_000;
const HEARTBEAT_NAMES = new Set(["ping", "heartbeat"]);

type StreamStatus = "idle" | "streaming" | "done" | "error";

function makePreWithCopy(onCopied?: (ok: boolean) => void) {
    return (props: HTMLAttributes<HTMLPreElement>) => {
        const ref = useRef<HTMLPreElement | null>(null);
        const onCopy = async () => {
            const text = ref.current?.textContent ?? "";
            try {
                await navigator.clipboard.writeText(text);
                onCopied?.(true);
            } catch {
                try {
                    const ta = document.createElement("textarea");
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                    onCopied?.(true);
                } catch {
                    onCopied?.(false);
                }
            }
        };
        return (
            <div className="codewrap">
                <pre ref={ref} {...props} />
                <button type="button" className="copybtn" onClick={onCopy}>
                    Copy
                </button>
            </div>
        );
    };
}

const InlineCode = (props: HTMLAttributes<HTMLElement>) => {
    const isInline = !/language-/.test(props.className || "");
    return isInline ? <code {...props} /> : <code {...props} />;
};

const LinkNewTab = (props: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} target="_blank" rel="noreferrer"/>
);

type LocalToast = { id: number; message: string; description?: string; duration?: number };

export default function ChatRoom() {
    const {threadId} = useParams<{ threadId?: string }>();

    const [messages, setMessages] = useState<UIMsg[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [ime, setIme] = useState(false);
    const [status, setStatus] = useState<StreamStatus>("idle");
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [toasts, setToasts] = useState<LocalToast[]>([]);
    const pushToast = (message: string, description?: string, duration = 2000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, {id, message, description, duration}]);
    };
    const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
    const esRef = useRef<EventSource | null>(null);
    const connectingRef = useRef(false);
    const assistantIdRef = useRef<string | null>(null);
    const abortedRef = useRef(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastEventAtRef = useRef<number>(Date.now());
    const attemptRef = useRef(0);
    const [cookieReady, setCookieReady] = useState(false);
    const [pendingSeed, setPendingSeed] = useState<string | null>(null);
    const seedInjectedRef = useRef(false);
    const seedSentRef = useRef(false);

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

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loading, status]);

    function clearTimer(ref: MutableRefObject<ReturnType<typeof setTimeout> | null>) {
        if (ref.current !== null) {
            clearTimeout(ref.current);
            ref.current = null;
        }
    }

    function resetIdleWatchdog() {
        lastEventAtRef.current = Date.now();
        clearTimer(idleTimerRef);
        idleTimerRef.current = setTimeout(() => {
            if (abortedRef.current) return;
            console.warn("SSE idle watchdog: no events for", IDLE_TIMEOUT_MS, "→ reconnect");
            safeReconnect();
        }, IDLE_TIMEOUT_MS);
    }

    function backoffDelay(attempt: number) {
        const cap = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempt);
        const jitter = Math.random() * 0.25 + 0.75;
        return Math.floor(cap * jitter);
    }

    function attachSseHandlers(es: EventSource) {
        es.onmessage = () => resetIdleWatchdog();

        es.addEventListener("skeleton", (ev) => {
            resetIdleWatchdog();
            const d = safeJSON<{ message_id?: string; id?: string }>((ev as MessageEvent).data);
            const draftId = d?.message_id ?? d?.id ?? `a-${Date.now()}`;
            assistantIdRef.current = draftId;
            setStatus("streaming");
            setMessages((prev) => [
                ...prev,
                {id: draftId, role: "assistant", content: "", createdAt: new Date().toISOString()},
            ]);
        });

        es.addEventListener("delta", (ev) => {
            resetIdleWatchdog();
            const d = safeJSON<{ delta?: string; message_id?: string }>((ev as MessageEvent).data);
            const chunk = d?.delta ?? "";
            if (!chunk) return;

            const targetId = assistantIdRef.current ?? d?.message_id ?? null;
            setMessages((prev) => {
                const next = [...prev];
                let idx = next.findIndex((m) => m.role === "assistant" && (!targetId || m.id === targetId));
                if (idx === -1) {
                    const draftId = targetId ?? `a-${Date.now()}`;
                    assistantIdRef.current = draftId;
                    next.push({id: draftId, role: "assistant", content: "", createdAt: new Date().toISOString()});
                    idx = next.length - 1;
                }
                next[idx] = {...next[idx], content: (next[idx].content || "") + chunk};
                return next;
            });
        });

        es.addEventListener("done", () => {
            resetIdleWatchdog();
            setStatus("done");
            assistantIdRef.current = null;

            if (threadId) {
                window.dispatchEvent(new CustomEvent("seta:title:check", {detail: {roomId: threadId}}));
            }
        });

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

        esRef.current?.close();
        esRef.current = null;

        const url = `${BASE}/sse/chat/${encodeURIComponent(roomId)}`;
        const es = new EventSource(url, {withCredentials: true});
        esRef.current = es;

        attachSseHandlers(es);
        resetIdleWatchdog();

        attemptRef.current = 0;
        connectingRef.current = false;
    }

    async function connectWithCookie(roomId: string) {
        await issueStreamCookie();
        setCookieReady(true);
        openRoomStream(roomId);
    }

    function safeReconnect() {
        if (abortedRef.current) return;
        if (reconnectTimerRef.current) return;

        esRef.current?.close();
        esRef.current = null;

        const delay = backoffDelay(attemptRef.current++);
        reconnectTimerRef.current = setTimeout(async () => {
            reconnectTimerRef.current = null;
            if (abortedRef.current || !threadId) return;

            try {
                if (attemptRef.current % 3 === 1) {
                    await issueStreamCookie();
                    setCookieReady(true);
                }
                openRoomStream(threadId);
            } catch (e) {
                console.error("reconnect cookie failed:", e);
                safeReconnect();
            }
        }, delay);
    }

    useEffect(() => {
        if (!threadId) return;
        abortedRef.current = false;

        (async () => {
            try {
                await connectWithCookie(threadId);
            } catch (e) {
                console.error("stream cookie failed:", e);
                setError("스트림 쿠키 발급 실패(403). 다시 로그인 후 재시도해주세요.");
                return;
            }
        })();

        const onOnline = () => safeReconnect();
        const onVisibility = () => {
            if (document.visibilityState === "visible") safeReconnect();
        };
        window.addEventListener("online", onOnline);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            abortedRef.current = true;
            setCookieReady(false);
            window.removeEventListener("online", onOnline);
            document.removeEventListener("visibilitychange", onVisibility);
            clearTimer(reconnectTimerRef);
            clearTimer(idleTimerRef);
            esRef.current?.close();
            esRef.current = null;
            assistantIdRef.current = null;
            setStatus("idle");
        };
    }, [threadId]);

    useEffect(() => {
        if (!threadId) return;
        if (!pendingSeed) return;
        if (seedSentRef.current) return;
        if (!cookieReady) return;

        (async () => {
            try {
                await sendMessageToServer(threadId, pendingSeed);
                setStatus("streaming");
                seedSentRef.current = true;
            } catch (e) {
                console.error("seed send failed:", e);
                setStatus("error");
            }
        })();
    }, [threadId, pendingSeed, cookieReady]);

    const sendingLocked = status === "streaming";

    async function send() {
        const text = input.trim();
        if (!threadId || !text || sendingLocked) return;

        setMessages((prev) => [
            ...prev,
            {id: `u-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString()},
        ]);
        setInput("");
        setStatus("streaming");
        try {
            await sendMessageToServer(threadId, text);
        } catch (e) {
            setStatus("error");
            console.error(e);
        }
    }

    const PreWithLocalToast = useMemo(
        () =>
            makePreWithCopy((ok) => {
                if (ok) pushToast("클립보드에 복사됐어요.");
                else pushToast("복사에 실패했어요.", "브라우저 권한을 확인해 주세요.");
            }),
        []
    );

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (ime) return;
        if (e.key === "Enter") send();
    };

    return (
        <>
            <div className="messages" ref={scrollRef}>
                {loading ? (
                    <div style={{opacity: 0.6, textAlign: "center", marginTop: 24}}>히스토리 불러오는 중…</div>
                ) : error ? (
                    <div style={{opacity: 0.85, color: "#f66", textAlign: "center", marginTop: 24}}>{error}</div>
                ) : messages.length === 0 ? (
                    <div style={{opacity: 0.6, textAlign: "center", marginTop: 24}}>
                        아직 메시지가 없어요. 아래 입력창에 메시지를 입력해보세요.
                    </div>
                ) : (
                    messages.map((m) => {
                        const isAssistant = m.role === "assistant";
                        const showLoader = isAssistant && status === "streaming" && (!m.content || m.content.length === 0);
                        return (
                            <div key={m.id} className={`msg ${m.role}`}>
                                <div className="bubble">
                                    {isAssistant ? (
                                        showLoader ? (
                                            <div className="three-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        ) : (
                                            <div className="md">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    rehypePlugins={[rehypeHighlight]}
                                                    components={{
                                                        pre: PreWithLocalToast,
                                                        code: InlineCode,
                                                        a: LinkNewTab
                                                    }}
                                                >
                                                    {m.content || ""}
                                                </ReactMarkdown>
                                            </div>
                                        )
                                    ) : (
                                        <>{m.content}</>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="chat-footer">
                <div className="chat-input-container">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder={sendingLocked ? "답변 생성 중…" : "메시지를 입력하세요…"}
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

            {toasts.map((t) =>
                createPortal(
                    <CustomToast
                        key={t.id}
                        message={t.message}
                        description={t.description}
                        duration={t.duration}
                        onClose={() => removeToast(t.id)}
                    />,
                    document.body
                )
            )}
        </>
    );
}

function safeJSON<T = unknown>(data: unknown): T | null {
    try {
        return typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
    } catch {
        return null;
    }
}
