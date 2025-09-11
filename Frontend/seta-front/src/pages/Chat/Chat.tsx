import "./Chat.css";
import Header from "@/ui/components/Header/Header";
import Logo from "@/assets/seta.png";
import ChatBg from "@/assets/ChatBackground.png";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

/* ===================== 타입 ===================== */
type Msg = { id: string; role: "user" | "assistant"; content: string };
type ThreadMeta = { id: string; title: string; last: string; updatedAt: number };

/* ===================== 로컬 스토리지 ===================== */
const KEY_THREADS = "seta:threads";
const KEY_MSGS = (id: string) => `seta:msgs:${id}`;

function loadThreads(): ThreadMeta[] {
    try { return JSON.parse(localStorage.getItem(KEY_THREADS) || "[]"); }
    catch { return []; }
}
function saveThreads(arr: ThreadMeta[]) {
    localStorage.setItem(KEY_THREADS, JSON.stringify(arr));
}
function loadMsgs(id: string): Msg[] {
    if (!id) return [];
    try { return JSON.parse(localStorage.getItem(KEY_MSGS(id)) || "[]"); }
    catch { return []; }
}
function saveMsgs(id: string, msgs: Msg[]) {
    localStorage.setItem(KEY_MSGS(id), JSON.stringify(msgs));
}
function clearAllSeta() {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
        if (k === KEY_THREADS || k.startsWith("seta:msgs:")) localStorage.removeItem(k);
    }
}

/* ===================== 아이콘(원본 유지) ===================== */
function AddIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
            <g clipPath="url(#clip0_add_373_2459)" filter="url(#filter0_d_add_373_2459)">
                <path d="M5.00097 13.0025C5.00097 7.91354 7.90454 3.56469 12.0023 1.81835C16.1001 3.56469 19.0037 7.91354 19.0037 13.0025C19.0037 13.8257 18.9277 14.6288 18.7837 15.406L20.724 17.2384C20.889 17.3945 20.928 17.6422 20.819 17.8415L18.3236 22.4174C18.2481 22.5559 18.1117 22.6507 17.9556 22.6731C17.7994 22.6956 17.6418 22.643 17.5304 22.5314L15.296 20.2969C15.1084 20.1094 14.8541 20.0039 14.5888 20.0039H9.41583C9.15058 20.0039 8.89622 20.1094 8.70869 20.2969L6.47426 22.5314C6.36283 22.643 6.20525 22.6956 6.04911 22.6731C5.89297 22.6507 5.75657 22.5559 5.6811 22.4174L3.18562 17.8415C3.07666 17.6422 3.11568 17.3945 3.28064 17.2384L5.22102 15.406C5.07799 14.6288 5.00097 13.8257 5.00097 13.0025ZM6.47726 19.6998L7.29442 18.8827C7.85701 18.3199 8.62009 18.0037 9.41583 18.0035H14.5888C15.3846 18.0037 16.1477 18.3199 16.7103 18.8827L17.5274 19.6998L18.5096 17.8995L17.4094 16.8593C16.9153 16.3926 16.6919 15.7071 16.8163 15.0389C16.9403 14.3748 17.0033 13.6937 17.0033 13.0025C17.0033 9.13178 15.0079 5.70111 12.0023 4.04079C8.99675 5.70111 7.00136 9.13178 7.00136 13.0025C7.00136 13.6937 7.06437 14.3748 7.1884 15.0399C7.31275 15.7081 7.08938 16.3936 6.59528 16.8603L5.49507 17.8995L6.47726 19.6998ZM12.0023 13.0025C10.8983 13.0025 10.0019 12.1062 10.0019 11.0021C10.0019 9.89809 10.8983 9.00175 12.0023 9.00175C13.1064 9.00175 14.0027 9.89809 14.0027 11.0021C14.0027 12.1062 13.1064 13.0025 12.0023 13.0025Z" fill="white"/>
            </g>
            <defs>
                <filter id="filter0_d_add_373_2459" x="-4" y="0" width="32.0047" height="32.0049" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="4"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_373_2459"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_373_2459" result="shape"/>
                </filter>
                <clipPath id="clip0_add_373_2459"><rect width="24.0047" height="24.0047" fill="white"/></clipPath>
            </defs>
        </svg>
    );
}

/* ===================== 메인 컴포넌트 ===================== */
export default function Chat() {
    const navigate = useNavigate();
    const { threadId } = useParams(); // URL 파라미터
    const [threads, setThreads] = useState<ThreadMeta[]>(() => loadThreads());
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null); // URL이 없어도 전환 보장
    const listRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    /* 화면 스크롤 잠금 */
    useEffect(() => {
        document.body.classList.add("no-scroll");
        document.documentElement.classList.add("no-scroll-html");
        return () => {
            document.body.classList.remove("no-scroll");
            document.documentElement.classList.remove("no-scroll-html");
        };
    }, []);

    /* 개발 초기화: Ctrl+Shift+X */
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
                clearAllSeta();
                setThreads([]); setMessages([]); setActiveId(null);
                navigate("/chat", { replace: true });
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [navigate]);

    /* 새로고침이면 시작화면으로 */
    useEffect(() => {
        const nav = performance.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
        if (threadId && nav?.type === "reload") navigate("/chat", { replace: true });
    }, [threadId, navigate]);

    /* URL ↔ state 동기화 */
    useEffect(() => {
        if (threadId) setActiveId(threadId);
        // URL이 없고 state만 있으면 그대로 유지(전환 보장)
    }, [threadId]);

    /* 활성 스레드 변경 시 메시지 로드 */
    useEffect(() => {
        if (activeId) setMessages(loadMsgs(activeId));
        else setMessages([]);
    }, [activeId]);

    /* 스크롤 맨 아래 */
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    const genId = () => `t-${Date.now()}`;

    const upsertThread = (meta: ThreadMeta) => {
        setThreads(prev => {
            const idx = prev.findIndex(t => t.id === meta.id);
            const next = idx >= 0
                ? [...prev.slice(0, idx), { ...prev[idx], ...meta }, ...prev.slice(idx + 1)]
                : [{ ...meta }, ...prev];
            saveThreads(next);
            return next;
        });
    };

    /* 새 스레드 생성 */
    const startNewChat = (seed?: string) => {
        const id = genId();
        setActiveId(id); // URL 실패해도 전환됨

        if (seed) {
            const first: Msg = { id: `u-${Date.now()}`, role: "user", content: seed };
            saveMsgs(id, [first]);
            setMessages([first]);
            upsertThread({ id, title: seed.slice(0, 30), last: seed, updatedAt: Date.now() });
        } else {
            saveMsgs(id, []);
            setMessages([]);
            upsertThread({ id, title: "새 채팅", last: "", updatedAt: Date.now() });
        }
        navigate(`/chat/${id}`);
    };

    /* 기존 스레드 열기(절대 생성 X) */
    const openThread = (id: string) => {
        if (activeId === id) return;
        setActiveId(id);
        navigate(`/chat/${id}`);
    };

    /* 한글 조합 중 Enter 방지 */
    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        // @ts-ignore
        if ((e.nativeEvent as any).isComposing) return;
        if (e.key === "Enter") send();
    };

    const send = () => {
        const text = input.trim();
        if (!text) return;

        // 시작화면에서 보낸 경우 → 방 만들고 전환
        if (!activeId) {
            startNewChat(text);
            setInput("");
            return;
        }

        const msg: Msg = { id: `u-${Date.now()}`, role: "user", content: text };
        const next = [...messages, msg];
        setMessages(next);
        saveMsgs(activeId, next);

        const title = threads.find(t => t.id === activeId)?.title || text.slice(0, 30);
        upsertThread({ id: activeId, title, last: text, updatedAt: Date.now() });
        setInput("");
    };

    const inChat = Boolean(activeId);

    return (
        <div
            className="chat-root"
            style={{
                backgroundImage: `url(${ChatBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
            }}
        >
            <Header />

            <div className="chat-stage">
                <div className="chat-canvas">
                    <div className="container">
                        {/* Sidebar */}
                        <aside className="sidebar">
                            <div className="sidebar-header">
                                <div className="sidebar-user">
                                    <div className="sidebar-avatar"><img src={Logo} alt="SETA" className="avatar-img" /></div>
                                    <div className="sidebar-user-info"><h3>SETA</h3></div>
                                </div>
                                <button className="sidebar-menu-btn" aria-label="sidebar menu">
                                    <span className="material-icons">more_horiz</span>
                                </button>
                            </div>

                            <div className="sidebar-main">
                                <div className="main-card">
                                    {/* 새 채팅(줄어들지 않도록 flex 고정) */}
                                    <button className="new-chat-btn" type="button" onClick={() => startNewChat()}>
                                        <AddIcon />새로운 채팅 시작하기
                                    </button>

                                    {/* 스레드 목록 (더미/시간/빈문구/구분선 없음) */}
                                    <div className="thread-list">
                                        {threads.map(t => (
                                            <div
                                                key={t.id}
                                                className="thread-item"
                                                onClick={() => openThread(t.id)}
                                                aria-current={t.id === activeId ? "page" : undefined}
                                                title={t.title || "(제목 없음)"}
                                            >
                                                <div className="thread-title">{t.title || "(제목 없음)"}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="sidebar-footer">
                                <div className="sidebar-avatar"><img src={Logo} alt="USER" className="avatar-img" /></div>
                                <div className="sidebar-user-info"><h3>USER</h3><p>PLUS</p></div>
                            </div>
                        </aside>

                        {/* Main Chat */}
                        <main className="main-chat">
                            <div className="chat-header">
                                <div className="chat-user">
                                    <div className="chat-avatar"><img src={Logo} alt="SETA Assistant" className="avatar-img" /></div>
                                    <div className="chat-user-info"><h3>SETA Assistant</h3></div>
                                </div>
                                <button className="chat-menu-btn" aria-label="chat menu">
                                    <span className="material-icons">more_horiz</span>
                                </button>
                            </div>

                            {/* 본문 */}
                            {!inChat ? (
                                <div className="chat-main">
                                    {/* 시작화면 유지(원하시면 이 영역은 숨겨도 됩니다) */}
                                    <div className="welcome-content">
                                        <div className="welcome-logo"><img src={Logo} alt="SETA Logo" /></div>
                                        <div className="welcome-title">안녕하세요!</div>
                                        <div className="welcome-subtitle">SETA Assistant입니다. 무엇을 도와드릴까요?</div>
                                        <div className="feature-cards">
                                            <div className="feature-card" onClick={() => startNewChat("새로운 프로젝트 아이디어를 제안해줘")}>
                                                <div className="feature-title">💡 프로젝트 아이디어</div>
                                                <div className="feature-description">새로운 프로젝트 아이디어를 제안해드릴까요?</div>
                                            </div>
                                            <div className="feature-card" onClick={() => startNewChat("React 성능 최적화 상담")}>
                                                <div className="feature-title">💻 기술 상담</div>
                                                <div className="feature-description">기술적인 질문이나 문제해결을 도와드릴게요</div>
                                            </div>
                                            <div className="feature-card" onClick={() => startNewChat("새로운 기술 학습 로드맵을 만들어줘")}>
                                                <div className="feature-title">📚 학습 가이드</div>
                                                <div className="feature-description">새로운 기술을 배우고 싶으신가요?</div>
                                            </div>
                                            <div className="feature-card" onClick={() => startNewChat("한 문장으로 빠르게 질문")}>
                                                <div className="feature-title">⚡ 빠른 질문</div>
                                                <div className="feature-description">궁금한 것이 있으시면 언제든지 물어보세요</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="messages" ref={listRef}>
                                    {messages.length === 0 ? (
                                        <div style={{ opacity: 0.6, textAlign: "center", marginTop: 24 }}>
                                            아직 메시지가 없어요. 아래 입력창에 메시지를 입력해보세요.
                                        </div>
                                    ) : (
                                        messages.map(m => (
                                            <div key={m.id} className={`msg ${m.role}`}>
                                                <div className="bubble">{m.content}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 프롬프트 */}
                            <div className="chat-footer">
                                <div className="chat-input-container">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="chat-input"
                                        placeholder={inChat ? "메시지를 입력하세요…" : "질문을 입력하세요…"}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={onKeyDown}
                                    />
                                    <button className="send-btn" aria-label="send" onClick={send}>
                                        <span className="material-icons">send</span>
                                    </button>
                                </div>
                                <div className="chat-disclaimer">SETA는 실수를 할 수 있습니다. 중요한 정보는 검증해 주세요.</div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
