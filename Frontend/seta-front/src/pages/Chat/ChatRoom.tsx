import "./Chat.css";
import Header from "@/ui/components/Header/Header";
import Logo from "@/assets/seta.png";
import ChatBg from "@/assets/ChatBackground.png";
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export default function ChatRoom() {
    const { threadId } = useParams();
    const [sp] = useSearchParams();
    const seed = sp.get("q") || "";

    const [messages, setMessages] = useState<Msg[]>(
        seed ? [{ id: "u1", role: "user", content: seed }] : []
    );
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [messages]);

    const send = () => {
        const text = input.trim();
        if (!text) return;
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
        setInput("");
    };

    return (
        <div className="chat-root" style={{
            backgroundImage: `url(${ChatBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
        }}>
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
                                <div className="main-card" style={{ padding: 16 }}>
                                    <div className="suggestions-nav" style={{ position: "static", height: "auto" }}>
                                        <div className="suggestion-item active">스레드: {threadId}</div>
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

                            {/* 메시지 리스트 */}
                            <div className="messages" ref={scrollRef}>
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

                            {/* 프롬프트 */}
                            <div className="chat-footer">
                                <div className="chat-input-container">
                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder="메시지를 입력하세요…"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") send(); }}
                                    />
                                    <button className="send-btn" aria-label="send" onClick={send}>
                                        <span className="material-icons">send</span>
                                    </button>
                                </div>
                                <div className="chat-disclaimer">
                                    SETA는 실수를 할 수 있습니다. 중요한 정보는 검증해 주세요.
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
