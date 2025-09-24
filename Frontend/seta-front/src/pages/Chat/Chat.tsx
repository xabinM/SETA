import "./Chat.css";
import Header from "@/ui/components/Header/Header";
import Logo from "@/assets/seta.png";
import ChatBg from "@/assets/ChatBackground.png";
import UserMenu from "@/ui/components/UserMenu/UserMenu";
import UserPersonalizeContainer from "@/ui/containers/UserPersonalize/UserPersonalizeContainer";
import {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {getChatRooms, type ChatRoom} from "@/features/chat/api";
import {loadCachedRooms, saveCachedRooms} from "@/features/chat/cache";

type Msg = { id: string; role: "user" | "assistant"; content: string };

function AddIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"
             aria-hidden {...props}>
            <g clipPath="url(#clip0_add_373_2459)" filter="url(#filter0_d_add_373_2459)">
                <path
                    d="M5.00097 13.0025C5.00097 7.91354 7.90454 3.56469 12.0023 1.81835C16.1001 3.56469 19.0037 7.91354 19.0037 13.0025C19.0037 13.8257 18.9277 14.6288 18.7837 15.406L20.724 17.2384C20.889 17.3945 20.928 17.6422 20.819 17.8415L18.3236 22.4174C18.2481 22.5559 18.1117 22.6507 17.9556 22.6731C17.7994 22.6956 17.6418 22.643 17.5304 22.5314L15.296 20.2969C15.1084 20.1094 14.8541 20.0039 14.5888 20.0039H9.41583C9.15058 20.0039 8.89622 20.1094 8.70869 20.2969L6.47426 22.5314C6.36283 22.643 6.20525 22.6956 6.04911 22.6731C5.89297 22.6507 5.75657 22.5559 5.6811 22.4174L3.18562 17.8415C3.07666 17.6422 3.11568 17.3945 3.28064 17.2384L5.22102 15.406C5.07799 14.6288 5.00097 13.8257 5.00097 13.0025ZM6.47726 19.6998L7.29442 18.8827C7.85701 18.3199 8.62009 18.0037 9.41583 18.0035H14.5888C15.3846 18.0037 16.1477 18.3199 16.7103 18.8827L17.5274 19.6998L18.5096 17.8995L17.4094 16.8593C16.9153 16.3926 16.6919 15.7071 16.8163 15.0389C16.9403 14.3748 17.0033 13.6937 17.0033 13.0025C17.0033 9.13178 15.0079 5.70111 12.0023 4.04079C8.99675 5.70111 7.00136 9.13178 7.00136 13.0025C7.00136 13.6937 7.06437 14.3748 7.1884 15.0399C7.31275 15.7081 7.08938 16.3936 6.59528 16.8603L5.49507 17.8995L6.47726 19.6998ZM12.0023 13.0025C10.8983 13.0025 10.0019 12.1062 10.0019 11.0021C10.0019 9.89809 10.8983 9.00175 12.0023 9.00175C13.1064 9.00175 14.0027 9.89809 14.0027 11.0021C14.0027 12.1062 13.1064 13.0025 12.0023 13.0025Z"
                    fill="white"/>
            </g>
            <defs>
                <filter id="filter0_d_add_373_2459" x="-4" y="0" width="32.0047" height="32.0049"
                        filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                   result="hardAlpha"/>
                    <feOffset dy="4"/>
                    <feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_373_2459"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_373_2459" result="shape"/>
                </filter>
                <clipPath id="clip0_add_373_2459">
                    <rect width="24.0047" height="24.0047" fill="white"/>
                </clipPath>
            </defs>
        </svg>
    );
}

export default function Chat() {
    const navigate = useNavigate();
    const {threadId} = useParams();
    const [rooms, setRooms] = useState<ChatRoom[]>(() => loadCachedRooms()); // ✅ 캐시로 초기화
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [roomsError, setRoomsError] = useState<string | null>(null);

    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [ime, setIme] = useState(false);
    const [personalizeOpen, setPersonalizeOpen] = useState(false);

    const onOpenPersonalize = () => {
        setMenuOpen(false);
        setPersonalizeOpen(true);
    };
    const onLogout = () => {
        navigate("/home", {replace: true});
    };

    // 스크롤 잠금
    useEffect(() => {
        document.body.classList.add("no-scroll");
        document.documentElement.classList.add("no-scroll-html");
        return () => {
            document.body.classList.remove("no-scroll");
            document.documentElement.classList.remove("no-scroll-html");
        };
    }, []);

    // URL 파라미터로 activeId 설정
    useEffect(() => {
        if (threadId) setActiveId(threadId);
    }, [threadId]);

    // 메시지 리스트 스크롤 항상 맨 아래
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    // 서버에서 채팅방 목록 불러오기 (캐시가 있어도 호출 → 최신화)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingRooms(rooms.length === 0); // 캐시가 없을 때만 로딩표시
                const data = await getChatRooms();
                if (!mounted) return;
                setRooms(data);
                saveCachedRooms(data); // ✅ 최신값 캐시에 저장
            } catch (e: unknown) {
                if (!mounted) return;
                setRoomsError(e instanceof Error ? e.message : "채팅방 목록 불러오기 실패");
                // 캐시가 있으면 조용히 유지, 없으면 에러 표시
            } finally {
                if (mounted) setLoadingRooms(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // rooms.length 를 의존성에 넣지 않는 게 포인트(초기 로딩만)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openThread = (id: string) => {
        if (activeId === id) return;
        setActiveId(id);
        navigate(`/chat/${id}`);
    };

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (ime) return;
        if (e.key === "Enter") send();
    };

    // 임시 send (API 붙이기 전)
    const send = () => {
        const text = input.trim();
        if (!text) return;
        const msg: Msg = {id: `u-${Date.now()}`, role: "user", content: text};
        setMessages(prev => [...prev, msg]);
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
            <Header/>

            <div className="chat-stage">
                <div className="chat-canvas">
                    <div className="container">
                        {/* Sidebar */}
                        <aside className="sidebar">
                            <div className="sidebar-header">
                                <div className="sidebar-user">
                                    <div className="sidebar-avatar"><img src={Logo} alt="SETA" className="avatar-img"/>
                                    </div>
                                    <div className="sidebar-user-info"><h3>SETA</h3></div>
                                </div>
                                <button className="sidebar-menu-btn" aria-label="sidebar menu">
                                    <span className="material-icons">more_horiz</span>
                                </button>
                            </div>

                            <div className="sidebar-main">
                                <div className="main-card">
                                    <button className="new-chat-btn" type="button" onClick={() => { /* TODO: 새 방 생성 API */
                                    }}>
                                        <AddIcon/>새로운 채팅 시작하기
                                    </button>

                                    {/* 서버 채팅방 목록 (캐시 → 즉시 표시, 이후 최신으로 교체) */}
                                    <div className="thread-list">
                                        {rooms.length === 0 && loadingRooms && (
                                            <div className="thread-item" style={{opacity: 0.7}}>불러오는 중…</div>
                                        )}
                                        {roomsError && rooms.length === 0 && (
                                            <div className="thread-item" style={{color: "#f66"}}>{roomsError}</div>
                                        )}

                                        {rooms.map(r => (
                                            <div
                                                key={r.chatRoomId}
                                                className="thread-item"
                                                onClick={() => openThread(r.chatRoomId)}
                                                aria-current={r.chatRoomId === activeId ? "page" : undefined}
                                                title={r.title || "(제목 없음)"}
                                            >
                                                <div className="thread-title">{r.title || "(제목 없음)"}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div
                                className="sidebar-footer"
                                ref={footerRef}
                                onClick={() => setMenuOpen(v => !v)}
                                role="button"
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") setMenuOpen(v => !v);
                                }}
                                style={{position: "relative", cursor: "pointer"}}
                            >
                                <div className="sidebar-avatar"><img src={Logo} alt="USER" className="avatar-img"/>
                                </div>
                                <div className="sidebar-user-info"><h3>USER</h3><p>PLUS</p></div>

                                <UserMenu
                                    open={menuOpen}
                                    anchorRef={footerRef}
                                    onClose={() => setMenuOpen(false)}
                                    onOpenPersonalize={onOpenPersonalize}
                                    onLogout={onLogout}
                                    align="left"
                                />
                            </div>
                        </aside>

                        <main className="main-chat">
                            <div className="chat-header">
                                <div className="chat-user">
                                    <div className="chat-avatar"><img src={Logo} alt="SETA Assistant"
                                                                      className="avatar-img"/></div>
                                    <div className="chat-user-info"><h3>SETA Assistant</h3></div>
                                </div>
                                <button className="chat-menu-btn" aria-label="chat menu">
                                    <span className="material-icons">more_horiz</span>
                                </button>
                            </div>

                            {!inChat ? (
                                <div className="chat-main">
                                    <div className="welcome-content">
                                        <div className="welcome-logo"><img src={Logo} alt="SETA Logo"/></div>
                                        <div className="welcome-title">안녕하세요!</div>
                                        <div className="welcome-subtitle">SETA Assistant입니다. 무엇을 도와드릴까요?</div>
                                        <div className="feature-cards">
                                            <div className="feature-card" onClick={() => { /* TODO: seed와 함께 새 방 생성 */
                                            }}>
                                                <div className="feature-title">💡 프로젝트 아이디어</div>
                                                <div className="feature-description">새로운 프로젝트 아이디어를 제안해드릴까요?</div>
                                            </div>
                                            <div className="feature-card" onClick={() => { /* TODO */
                                            }}>
                                                <div className="feature-title">💻 기술 상담</div>
                                                <div className="feature-description">기술적인 질문이나 문제해결을 도와드릴게요</div>
                                            </div>
                                            <div className="feature-card" onClick={() => { /* TODO */
                                            }}>
                                                <div className="feature-title">📚 학습 가이드</div>
                                                <div className="feature-description">새로운 기술을 배우고 싶으신가요?</div>
                                            </div>
                                            <div className="feature-card" onClick={() => { /* TODO */
                                            }}>
                                                <div className="feature-title">⚡ 빠른 질문</div>
                                                <div className="feature-description">궁금한 것이 있으시면 언제든지 물어보세요</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="messages" ref={listRef}>
                                    {messages.length === 0 ? (
                                        <div style={{opacity: 0.6, textAlign: "center", marginTop: 24}}>
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
                                        onCompositionStart={() => setIme(true)}
                                        onCompositionEnd={() => setIme(false)}
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

            <UserPersonalizeContainer
                open={personalizeOpen}
                onClose={() => setPersonalizeOpen(false)}
            />
        </div>
    );
}