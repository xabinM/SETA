import "./Chat.css";
import Header from "@/ui/components/Header/Header";
import Logo from "@/assets/seta.png";
import ChatBg from "@/assets/ChatBackground.png";
import UserMenu from "@/ui/components/UserMenu/UserMenu";
import UserPersonalizeContainer from "@/ui/containers/UserPersonalize/UserPersonalizeContainer";
import { useCallback, useEffect, useRef, useState, type SVGProps } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { getChatRooms, createChatRoom, deleteChatRoom, type ChatRoom } from "@/features/chat/api";
import { loadCachedRooms, saveCachedRooms } from "@/features/chat/cache";
import { getMe } from "@/features/auth/api";
import type { Me } from "@/features/auth/api";

function AddIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" aria-hidden {...props}>
            <g clipPath="url(#clip0_add_373_2459)" filter="url(#filter0_d_add_373_2459)">
                <path
                    d="M5.00097 13.0025C5.00097 7.91354 7.90454 3.56469 12.0023 1.81835C16.1001 3.56469 19.0037 7.91354 19.0037 13.0025C19.0037 13.8257 18.9277 14.6288 18.7837 15.406L20.724 17.2384C20.889 17.3945 20.928 17.6422 20.819 17.8415L18.3236 22.4174C18.2481 22.5559 18.1117 22.6507 17.9556 22.6731C17.7994 22.6956 17.6418 22.643 17.5304 22.5314L15.296 20.2969C15.1084 20.1094 14.8541 20.0039 14.5888 20.0039H9.41583C9.15058 20.0039 8.89622 20.1094 8.70869 20.2969L6.47426 22.5314C6.36283 22.643 6.20525 22.6956 6.04911 22.6731C5.89297 22.6507 5.75657 22.5559 5.6811 22.4174L3.18562 17.8415C3.07666 17.6422 3.11568 17.3945 3.28064 17.2384L5.22102 15.406C5.07799 14.6288 5.00097 13.8257 5.00097 13.0025ZM6.47726 19.6998L7.29442 18.8827C7.85701 18.3199 8.62009 18.0037 9.41583 18.0035H14.5888C15.3846 18.0037 16.1477 18.3199 16.7103 18.8827L17.5274 19.6998L18.5096 17.8995L17.4094 16.8593C16.9153 16.3926 16.6919 15.7071 16.8163 15.0389C16.9403 14.3748 17.0033 13.6937 17.0033 13.0025C17.0033 9.13178 15.0079 5.70111 12.0023 4.04079C8.99675 5.70111 7.00136 9.13178 7.00136 13.0025C7.00136 13.6937 7.06437 14.3748 7.1884 15.0399C7.31275 15.7081 7.08938 16.3936 6.59528 16.8603L5.49507 17.8995L6.47726 19.6998ZM12.0023 13.0025C10.8983 13.0025 10.0019 12.1062 10.0019 11.0021C10.0019 9.89809 10.8983 9.00175 12.0023 9.00175C13.1064 9.00175 14.0027 9.89809 14.0027 11.0021C14.0027 12.1062 13.1064 13.0025 12.0023 13.0025Z"
                    fill="white"
                />
            </g>
            <defs>
                <filter id="filter0_d_add_373_2459" x="-4" y="0" width="32.0047" height="32.0049" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_373_2459" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_373_2459" result="shape" />
                </filter>
                <clipPath id="clip0_add_373_2459">
                    <rect width="24.0047" height="24.0047" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
}

type CtxMenu = { open: boolean; x: number; y: number; roomId: string | null };

export default function Chat() {
    const navigate = useNavigate();
    const { threadId } = useParams<{ threadId?: string }>(); // /chat 에선 undefined
    const activeId = threadId ?? null;

    // 사용자 정보
    const [me, setMe] = useState<Me | null>(null);
    const [meLoading, setMeLoading] = useState(false);

    // 방 목록/에러/로딩/생성/삭제
    const [rooms, setRooms] = useState<ChatRoom[]>(() => loadCachedRooms());
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // 컨텍스트 메뉴
    const [ctx, setCtx] = useState<CtxMenu>({ open: false, x: 0, y: 0, roomId: null });

    // 유저 메뉴/개인화 모달
    const footerRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [personalizeOpen, setPersonalizeOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // /chat 입력창 상태 (시드)
    const [seed, setSeed] = useState("");
    const [ime, setIme] = useState(false);

    const onOpenPersonalize = useCallback(() => {
        setMenuOpen(false);
        setPersonalizeOpen(true);
    }, []);

    const onLogout = useCallback(() => {
        navigate("/home", { replace: true });
    }, [navigate]);

    // /api/auth/me
    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            try {
                setMeLoading(true);
                const data = await getMe(ac.signal);
                setMe(data);
            } catch (err) {
                console.warn("getMe failed", err);
                setMe(null);
            } finally {
                setMeLoading(false);
            }
        })();
        return () => ac.abort();
    }, []);

    // 새 방 생성
    const onCreateRoom = useCallback(async () => {
        if (creating) return;
        try {
            setCreating(true);
            const room = await createChatRoom();
            setRooms((prev) => {
                const next = [room, ...prev.filter((p) => p.chatRoomId !== room.chatRoomId)];
                saveCachedRooms(next);
                return next;
            });
            navigate(`/chat/${room.chatRoomId}`);
        } catch (e) {
            console.error(e);
            setRoomsError("채팅방 생성 실패");
        } finally {
            setCreating(false);
        }
    }, [creating, navigate]);

    // 새 방 생성 + 시드 전송
    const onCreateRoomAndSeed = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || creating) return;
            try {
                setCreating(true);
                const room = await createChatRoom();
                sessionStorage.setItem(`seta:seed:${room.chatRoomId}`, trimmed);
                setRooms((prev) => {
                    const next = [room, ...prev.filter((p) => p.chatRoomId !== room.chatRoomId)];
                    saveCachedRooms(next);
                    return next;
                });
                navigate(`/chat/${room.chatRoomId}`);
                setSeed("");
            } catch (e) {
                console.error(e);
                setRoomsError("채팅방 생성 실패");
            } finally {
                setCreating(false);
            }
        },
        [creating, navigate]
    );

    // 스크롤 처리 - 하나의 useEffect로 통합 및 mobile-scroll-enabled 클래스 추가
    useEffect(() => {
        const updateScrollBehavior = () => {
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // 모바일: 스크롤 허용
                document.body.classList.remove("no-scroll");
                document.documentElement.classList.remove("no-scroll-html");
                document.body.classList.add("mobile-scroll-enabled");
            } else {
                // 데스크톱: 스크롤 잠금
                document.body.classList.remove("mobile-scroll-enabled");
                document.body.classList.add("no-scroll");
                document.documentElement.classList.add("no-scroll-html");
            }
        };

        // 초기 설정
        updateScrollBehavior();
        
        // 리사이즈 이벤트 리스너
        window.addEventListener('resize', updateScrollBehavior);
        
        return () => {
            document.body.classList.remove("no-scroll", "mobile-scroll-enabled");
            document.documentElement.classList.remove("no-scroll-html");
                     window.removeEventListener('resize', updateScrollBehavior);
        };
    }, []);


    useEffect(() => {
    const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
}, []);

    // 서버에서 방 목록 최신화
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingRooms(rooms.length === 0);
                const data = await getChatRooms();
                if (!mounted) return;
                setRooms(data);
                saveCachedRooms(data);
            } catch {
                if (mounted) setRoomsError("채팅방 목록 불러오기 실패");
            } finally {
                if (mounted) setLoadingRooms(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 방 이동
    const openThread = (id: string) => {
        if (activeId === id) return;
        navigate(`/chat/${id}`);
    };

    // 우클릭 컨텍스트 메뉴
    const onRightClickRoom = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const MENU_W = 132;
        const MENU_H = 36;
        const pad = 8;
        const x = Math.min(e.clientX, window.innerWidth - MENU_W - pad);
        const y = Math.min(e.clientY, window.innerHeight - MENU_H - pad);
        setCtx({ open: true, x, y, roomId: id });
    };

    // ESC로 컨텍스트 메뉴 닫기
    useEffect(() => {
        if (!ctx.open) return;
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setCtx({ open: false, x: 0, y: 0, roomId: null });
        };
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [ctx.open]);

    // 방 삭제
    const onDeleteRoom = useCallback(async () => {
        if (!ctx.roomId) return;
        const roomId = ctx.roomId;
        setCtx({ open: false, x: 0, y: 0, roomId: null });

        try {
            setDeletingId(roomId);
            await deleteChatRoom(roomId);
            setRooms((prev) => {
                const next = prev.filter((r) => r.chatRoomId !== roomId);
                saveCachedRooms(next);
                return next;
            });
            if (activeId === roomId) navigate("/chat", { replace: true });
        } catch (e) {
            console.error(e);
            alert("채팅방 삭제에 실패했습니다.");
        } finally {
            setDeletingId(null);
        }
    }, [ctx.roomId, navigate, activeId]);

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
                        {/* 모바일용 백드롭 */}
                        {isMobile && (
                            <div 
                                className={`sidebar-backdrop ${sidebarOpen ? 'sidebar-open' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            />
                        )}
                        
                        {/* Sidebar */}
                        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                            <div className="sidebar-header">
                                <div className="sidebar-user">
                                    <div className="sidebar-avatar">
                                        <img src={Logo} alt="SETA" className="avatar-img" />
                                    </div>
                                    <div className="sidebar-user-info">
                                        <h3>SETA</h3>
                                    </div>
                                </div>
                                <button 
                                    className="sidebar-menu-btn" 
                                    onClick={() => isMobile ? setSidebarOpen(false) : undefined}
                                    aria-label={isMobile ? "사이드바 닫기" : "sidebar menu"}
                                >
                                    <span className="material-icons">{isMobile ? "close" : "more_horiz"}</span>
                                </button>
                            </div>

                            <div className="sidebar-main">
                                <div className="main-card">
                                    <button
                                        className="new-chat-btn"
                                        type="button"
                                        onClick={onCreateRoom}
                                        disabled={creating}
                                        aria-busy={creating}
                                        title={creating ? "생성 중…" : "새로운 채팅 시작하기"}
                                    >
                                        <AddIcon />
                                        {creating ? "생성 중…" : "새로운 채팅 시작하기"}
                                    </button>

                                    {/* 서버 채팅방 목록 */}
                                    <div className="thread-list">
                                        {rooms.length === 0 && loadingRooms && (
                                            <div className="thread-item" style={{ opacity: 0.7 }}>
                                                불러오는 중…
                                            </div>
                                        )}
                                        {roomsError && rooms.length === 0 && (
                                            <div className="thread-item" style={{ color: "#f66" }}>
                                                {roomsError}
                                            </div>
                                        )}

                                        {rooms.map((r) => (
                                            <div
                                                key={r.chatRoomId}
                                                className="thread-item"
                                                onClick={() => openThread(r.chatRoomId)}
                                                onContextMenu={(e) => onRightClickRoom(e, r.chatRoomId)}
                                                aria-current={r.chatRoomId === activeId ? "page" : undefined}
                                                title={r.title || "(제목 없음)"}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    opacity: deletingId === r.chatRoomId ? 0.5 : 1,
                                                }}
                                            >
                                                <div
                                                    className="thread-title"
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        overflow: "hidden",
                                                        whiteSpace: "nowrap",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {r.title || "(제목 없음)"}
                                                </div>
                                                <div style={{ width: 4, flex: "0 0 4px" }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div
                                className="sidebar-footer"
                                ref={footerRef}
                                onClick={() => setMenuOpen((v) => !v)}
                                role="button"
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") setMenuOpen((v) => !v);
                                }}
                                style={{ position: "relative", cursor: "pointer" }}
                            >
                                <div className="sidebar-avatar">
                                    <img src={Logo} alt="USER" className="avatar-img" />
                                </div>
                                <div className="sidebar-user-info">
                                    <h3>{me?.name || me?.username || (meLoading ? "불러오는 중…" : "USER")}</h3>
                                    <p>PLUS</p>
                                </div>

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

                        {/* ===== Right: threadId 있으면 Outlet(=ChatRoom), 없으면 웰컴 ===== */}
                        <main className="main-chat">
                            <div className="chat-header">
                                <div className="chat-user">
                                    {isMobile && (
                                        <button 
                                            className="chat-menu-btn" 
                                            onClick={() => setSidebarOpen(true)}
                                            aria-label="사이드바 열기"
                                        >
                                            <span className="material-icons">menu</span>
                                        </button>
                                    )}
                                    <div className="chat-avatar"><img src={Logo} alt="SETA Assistant"
                                                                      className="avatar-img"/></div>
                                    <div className="chat-user-info"><h3>SETA Assistant</h3></div>
                                    <div className="chat-avatar">
                                        <img src={Logo} alt="SETA Assistant" className="avatar-img" />
                                    </div>
                                    <div className="chat-user-info">
                                        <h3>SETA Assistant</h3>
                                    </div>
                                </div>
                                <button className="chat-menu-btn" aria-label="chat menu">
                                    <span className="material-icons">more_horiz</span>
                                </button>
                            </div>

                            {threadId ? (
                                <Outlet />
                            ) : (
                                <>
                                    <div className="chat-main">
                                        <div className="welcome-content">
                                            <div className="welcome-logo">
                                                <img src={Logo} alt="SETA Logo" />
                                            </div>
                                            <div className="welcome-title">안녕하세요!</div>
                                            <div className="welcome-subtitle">SETA Assistant입니다. 무엇을 도와드릴까요?</div>
                                            <div className="feature-cards">
                                                <div className="feature-card" onClick={() => onCreateRoomAndSeed("프로젝트 아이디어가 필요해요")}>
                                                    <div className="feature-title">💡 프로젝트 아이디어</div>
                                                    <div className="feature-description">새로운 프로젝트 아이디어를 제안해드릴까요?</div>
                                                </div>
                                                <div className="feature-card" onClick={() => onCreateRoomAndSeed("리액트/타입스크립트 이슈 상담할게요")}>
                                                    <div className="feature-title">💻 기술 상담</div>
                                                    <div className="feature-description">기술적인 질문이나 문제해결을 도와드릴게요</div>
                                                </div>
                                                <div className="feature-card" onClick={() => onCreateRoomAndSeed("학습 로드맵 추천해줘")}>
                                                    <div className="feature-title">📚 학습 가이드</div>
                                                    <div className="feature-description">새로운 기술을 배우고 싶으신가요?</div>
                                                </div>
                                                <div className="feature-card" onClick={() => onCreateRoomAndSeed("빠른 질문: ")}>
                                                    <div className="feature-title">⚡ 빠른 질문</div>
                                                    <div className="feature-description">궁금한 것이 있으시면 언제든지 물어보세요</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* /chat 하단 입력바: 엔터=새 방 생성 후 시드 전송 */}
                                    <div className="chat-footer">
                                        <div className="chat-input-container">
                                            <input
                                                type="text"
                                                className="chat-input"
                                                placeholder="무엇이든 물어보세요."
                                                value={seed}
                                                onChange={(e) => setSeed(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (ime) return;
                                                    if (e.key === "Enter") onCreateRoomAndSeed(seed);
                                                }}
                                                onCompositionStart={() => setIme(true)}
                                                onCompositionEnd={() => setIme(false)}
                                            />
                                            <button
                                                className="send-btn"
                                                aria-label="send"
                                                onClick={() => onCreateRoomAndSeed(seed)}
                                                disabled={!seed.trim() || creating}
                                            >
                                                <span className="material-icons">send</span>
                                            </button>
                                        </div>
                                        <div className="chat-disclaimer">SETA는 실수를 할 수 있습니다. 중요한 정보는 검증해 주세요.</div>
                                    </div>
                                </>
                            )}
                        </main>
                    </div>
                </div>
            </div>

            {/* Context menu (우클릭) */}
            {ctx.open && (
                <div onClick={() => setCtx({ open: false, x: 0, y: 0, roomId: null })} style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
                    <div
                        role="menu"
                        aria-label="채팅방 메뉴"
                        className="ctxmenu"
                        style={{ top: ctx.y, left: ctx.x, position: "fixed" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button type="button" onClick={onDeleteRoom} disabled={deletingId === ctx.roomId} className="ctxitem danger">
              <span className="ctxitem__icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M9 3h6a1 1 0 0 1 1 1v1h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                      d="M4 5h16M6 5l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  />
                  <path d="M10 9v8M14 9v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
                            <span className="ctxitem__label">{deletingId === ctx.roomId ? "Deleting…" : "Delete"}</span>
                        </button>
                    </div>
                </div>
            )}

            <UserPersonalizeContainer open={personalizeOpen} onClose={() => setPersonalizeOpen(false)} />
        </div>
    );
}