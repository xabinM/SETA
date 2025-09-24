import "./Chat.css";
import Header from "@/ui/components/Header/Header";
import Logo from "@/assets/seta.png";
import ChatBg from "@/assets/ChatBackground.png";
import UserMenu from "@/ui/components/UserMenu/UserMenu"; // 👈 추가
import { useParams, useSearchParams, useNavigate } from "react-router-dom"; // 👈 navigate 추가
import { useEffect, useRef, useState } from "react";

type Msg = { id: string; role: "user" | "assistant"; content: string };

// seta:* 키만 정리 (메인과 동일 동작)
function clearAllSeta() {
  const keys = Object.keys(localStorage);
  for (const k of keys) {
    if (k === "seta:threads" || k.startsWith("seta:msgs:")) {
      localStorage.removeItem(k);
    }
  }
}

export default function ChatRoom() {
  const { threadId } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate(); // 👈 추가
  const seed = sp.get("q") || "";

  // 이 화면에서만 문서 스크롤 잠그기
  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  // 디자인 확인용: 사용자 메시지만 표시 (어시스턴트 자동응답 없음)
  const [messages, setMessages] = useState<Msg[]>(
      seed ? [{ id: "u1", role: "user", content: seed }] : []
  );
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // IME 조합 상태 (한/일 등)
  const [ime, setIme] = useState(false); // 👈 추가

  // 유저 메뉴(drop-up) 상태
  const footerRef = useRef<HTMLDivElement>(null); // 👈 추가
  const [menuOpen, setMenuOpen] = useState(false); // 👈 추가
  const onOpenPersonalize = () => {
    setMenuOpen(false);
    // TODO: 개인화 모달 연결 (setPzOpen(true))
  };
  const onLogout = () => {
    setMenuOpen(false);
    clearAllSeta();
    navigate("/home", { replace: true });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text },
    ]);
    setInput("");
  };

  // Enter 전송(IME 조합 중이면 무시)
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
                  <div className="main-card" style={{ padding: 16 }}>
                    <div
                        className="suggestions-nav"
                        style={{ position: "static", height: "auto" }}
                    >
                      <div className="suggestion-item active">스레드: {threadId}</div>
                    </div>
                  </div>
                </div>

                {/* 👇 팝오버(drop-up) 붙인 푸터 */}
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

              {/* Main Chat */}
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

                {/* 메시지 리스트 */}
                <div className="messages" ref={scrollRef}>
                  {messages.length === 0 ? (
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

                {/* 프롬프트 */}
                <div className="chat-footer">
                  <div className="chat-input-container">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="메시지를 입력하세요…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        onCompositionStart={() => setIme(true)}   // 👈 IME 시작
                        onCompositionEnd={() => setIme(false)}    // 👈 IME 종료
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