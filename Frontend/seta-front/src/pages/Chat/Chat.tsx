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

function AddIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" aria-hidden {...props}>
            <path d="M12 5v14m-7-7h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function Chat() {
    const navigate = useNavigate();
    const { threadId } = useParams(); // /chat 에선 undefined
    const activeId = threadId ?? null;

    const [rooms, setRooms] = useState<ChatRoom[]>(() => loadCachedRooms());
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    type CtxMenu = { open: boolean; x: number; y: number; roomId: string | null };
    const [ctx, setCtx] = useState<CtxMenu>({ open: false, x: 0, y: 0, roomId: null });
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const footerRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [personalizeOpen, setPersonalizeOpen] = useState(false);

    const onOpenPersonalize = useCallback(() => {
        setMenuOpen(false);
        setPersonalizeOpen(true);
    }, []);

    const onLogout = useCallback(() => {
        navigate("/home", { replace: true });
    }, [navigate]);

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

    useEffect(() => {
        document.body.classList.add("no-scroll");
        document.documentElement.classList.add("no-scroll-html");
        return () => {
            document.body.classList.remove("no-scroll");
            document.documentElement.classList.remove("no-scroll-html");
        };
    }, []);

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

    const openThread = (id: string) => {
        if (activeId === id) return;
        navigate(`/chat/${id}`);
    };

    const onRightClickRoom = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const MENU_W = 132;
        const MENU_H = 36;
        const pad = 8;
        const x = Math.min(e.clientX, window.innerWidth - MENU_W - pad);
        const y = Math.min(e.clientY, window.innerHeight - MENU_H - pad);
        setCtx({ open: true, x, y, roomId: id });
    };

    useEffect(() => {
        if (!ctx.open) return;
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setCtx({ open: false, x: 0, y: 0, roomId: null });
        };
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [ctx.open]);

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
            navigate("/chat", { replace: true });
        } catch (e) {
            console.error(e);
            alert("채팅방 삭제에 실패했습니다.");
        } finally {
            setDeletingId(null);
        }
    }, [ctx.roomId, navigate]);

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
                                    <div className="sidebar-avatar">
                                        <img src={Logo} alt="SETA" className="avatar-img" />
                                    </div>
                                    <div className="sidebar-user-info">
                                        <h3>SETA</h3>
                                    </div>
                                </div>
                                <button className="sidebar-menu-btn" aria-label="sidebar menu">
                                    <span className="material-icons">more_horiz</span>
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
                                    <h3>USER</h3>
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

                        {/* Right: threadId 있으면 Outlet(=ChatRoom), 없으면 웰컴 */}
                        <main className="main-chat">
                            <div className="chat-header">
                                <div className="chat-user">
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
                                <div className="chat-main">
                                    <div className="welcome-content">
                                        <div className="welcome-logo">
                                            <img src={Logo} alt="SETA Logo" />
                                        </div>
                                        <div className="welcome-title">안녕하세요!</div>
                                        <div className="welcome-subtitle">SETA Assistant입니다. 무엇을 도와드릴까요?</div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>

            {/* Context menu */}
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
                  <path d="M4 5h16M6 5l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
