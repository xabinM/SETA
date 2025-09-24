import "./Chat.css";
import Header from "@/ui/components/Header/Header";
import Logo from "@/assets/seta.png";
import ChatBg from "@/assets/ChatBackground.png";
import UserMenu from "@/ui/components/UserMenu/UserMenu";
import {useParams, useSearchParams, useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {getRoomMessages, type UIMsg} from "@/features/chat/api";

function clearAllSeta() {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
        if (k === "seta:threads" || k.startsWith("seta:msgs:")) {
            localStorage.removeItem(k);
        }
    }
}

export default function ChatRoom() {
    const {threadId} = useParams();
    const [sp] = useSearchParams();
    const navigate = useNavigate();
    const seed = sp.get("q") || "";

    const [messages, setMessages] = useState<UIMsg[]>(
        threadId ? [] : seed ? [{id: "seed-1", role: "user", content: seed, createdAt: new Date().toISOString()}] : []
    );
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [ime, setIme] = useState(false);

    const footerRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const onOpenPersonalize = () => setMenuOpen(false);
    const onLogout = () => {
        setMenuOpen(false);
        clearAllSeta();
        navigate("/home", {replace: true});
    };

    useEffect(() => {
        document.body.classList.add("no-scroll");
        return () => document.body.classList.remove("no-scroll");
    }, []);

    useEffect(() => {
        if (!threadId) return;
        let alive = true;
        (async () => {
            try {
                setLoadingHistory(true);
                setHistoryError(null);
                const data = await getRoomMessages(threadId);
                if (!alive) return;
                setMessages(data);
            } catch (e) {
                if (!alive) return;
                setHistoryError(e instanceof Error ? e.message : "대화 불러오기 실패");
                setMessages([]);
            } finally {
                if (alive) setLoadingHistory(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [threadId]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loadingHistory]);

    const send = () => {
        const text = input.trim();
        if (!text) return;
        const temp: UIMsg = {id: `u-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString()};
        setMessages((prev) => [...prev, temp]);
        setInput("");
    };

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (ime) return;
        if (e.key === "Enter") send();
    };

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
                        <aside className="sidebar">
                            <div className="sidebar-header">
                                <div className="sidebar-user">
                                    <div className="sidebar-avatar">
                                        <img src={Logo} alt="SETA" className="avatar-img"/>
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
                                <div className="main-card" style={{padding: 16}}>
                                    <div className="suggestions-nav" style={{position: "static", height: "auto"}}>
                                        <div className="suggestion-item active">스레드: {threadId ?? "-"}</div>
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
                                style={{position: "relative", cursor: "pointer"}}
                            >
                                <div className="sidebar-avatar">
                                    <img src={Logo} alt="USER" className="avatar-img"/>
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

                        <main className="main-chat">
                            <div className="chat-header">
                                <div className="chat-user">
                                    <div className="chat-avatar">
                                        <img src={Logo} alt="SETA Assistant" className="avatar-img"/>
                                    </div>
                                    <div className="chat-user-info">
                                        <h3>SETA Assistant</h3>
                                    </div>
                                </div>
                                <button className="chat-menu-btn" aria-label="chat menu">
                                    <span className="material-icons">more_horiz</span>
                                </button>
                            </div>

                            <div className="messages" ref={scrollRef}>
                                {loadingHistory ? (
                                    <div style={{opacity: 0.6, textAlign: "center", marginTop: 24}}>히스토리 불러오는 중…</div>
                                ) : historyError ? (
                                    <div style={{
                                        opacity: 0.85,
                                        color: "#f66",
                                        textAlign: "center",
                                        marginTop: 24
                                    }}>{historyError}</div>
                                ) : messages.length === 0 ? (
                                    <div style={{opacity: 0.6, textAlign: "center", marginTop: 24}}>
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
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}