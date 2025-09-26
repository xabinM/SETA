import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./TreeModal.css";
import type { TreeModalProps, TimelineItem } from "./types";
import { useNavigate } from "react-router-dom";
import CustomToast from "@/ui/components/Toast/CustomToast";

export default function TreeModal({
                                      open,
                                      onClose,
                                      tokens,
                                      trees,
                                      kpis,
                                      timeline,
                                  }: TreeModalProps) {
    const shellRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [toast, setToast] = useState<{ msg: string; desc?: string } | null>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    // 타임라인 진행도 변수 주입
    useEffect(() => {
        if (!open || !shellRef.current) return;
        const val = Math.min(0.999, tokens.current / tokens.goal);
        shellRef.current.style.setProperty("--timeline-progress", String(val));
    }, [open, tokens.current, tokens.goal]);

    if (!open) return null;

    const pct = Math.min(100, Math.round((tokens.current / tokens.goal) * 100));
    const remaining = Math.max(0, tokens.goal - tokens.current);
    const fmt = (n: number) => n.toLocaleString();

    const getTreeStatus = (treeIndex: number) => {
        const requiredTokens = (treeIndex + 1) * tokens.step;
        return tokens.current >= requiredTokens;
    };

    const getTimelineStatus = (_timelineItem: TimelineItem, index: number) => {
        const requiredTokens = (index + 1) * tokens.step;
        if (tokens.current >= requiredTokens) return "done";
        if (tokens.current >= requiredTokens - tokens.step) return "progress";
        return "upcoming";
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText("https://www.seta.ai.kr");
            setToast({
                msg: "주소가 복사되었습니다!",
                desc: "친구에게 바로 붙여넣기 해보세요 🚀",
            });
        } catch (err) {
            console.error("Clipboard copy failed", err);
            setToast({
                msg: "복사 실패",
                desc: "브라우저 보안 설정을 확인해주세요",
            });
        }
    };

    // 포털로 모달과 토스트를 함께 렌더
    return createPortal(
        <>
            <div
                className="treemodal-backdrop"
                onMouseDown={(e) => e.target === e.currentTarget && onClose()}
            >
                <div
                    ref={shellRef}
                    className="treemodal-shell"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="lgm-hero-title"
                >
                    <main className="lgm-container">
                        {/* X 버튼 */}
                        <button type="button" className="lgm-close" aria-label="닫기" onClick={onClose}>
                            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                                <path
                                    d="M4.5 4.5 L13.5 13.5 M13.5 4.5 L4.5 13.5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>

                        {/* Hero */}
                        <section className="lgm-card" aria-labelledby="lgm-hero-title">
                            <div className="lgm-header">
                                <div className="lgm-badge" aria-hidden="true">
                                    <img
                                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Christmas%20Tree.png"
                                        alt="Christmas Tree"
                                        width="50"
                                        height="50"
                                    />
                                </div>
                                <h1 id="lgm-hero-title" className="lgm-title">
                                    MY SETA TREE
                                </h1>
                            </div>
                            <p className="lgm-subtitle">
                                AI 사용을 최적화하여 실제 환경에 기여하는 가상의 나무들입니다.
                                <br />
                                매 {tokens.step.toLocaleString()}토큰 절약마다 새로운 나무가 자라나요!
                            </p>
                        </section>

                        {/* Trees */}
                        <section className="lgm-card">
                            <div className="lgm-tree-garden">
                                {trees.map((t, i) => {
                                    const isAchieved = getTreeStatus(i);
                                    return (
                                        <div key={i} className={`lgm-tree ${isAchieved ? "lgm-tree--ok" : ""}`}>
                                            <div
                                                className="lgm-tree__emoji"
                                                aria-hidden="true"
                                                style={{
                                                    opacity: isAchieved ? 1 : i === trees.length - 1 ? 0.35 : 0.65,
                                                }}
                                            >
                                                {t.emoji}
                                            </div>
                                            <div className={`lgm-tag ${isAchieved ? "lgm-tag--ok" : ""}`}>{t.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Progress */}
                        <section className="lgm-card" aria-labelledby="lgm-progress-title">
                            <h2 id="lgm-progress-title" className="lgm-section-title">
                                <img
                                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Maracas.png"
                                    alt="Maracas"
                                    width="25"
                                    height="25"
                                />{" "}
                                다음 나무까지의 진행상황
                            </h2>
                            <div className="lgm-progress">
                                <div
                                    className="lgm-bar"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={pct}
                                >
                                    <div className="lgm-fill" style={{ width: `${pct}%` }} />
                                    <div className="lgm-pct">{pct}%</div>
                                </div>
                                <div className="lgm-meta">
                                    <div className="lgm-chip lgm-chip--green">현재: {fmt(tokens.current)}토큰</div>
                                    <div className="lgm-chip">목표: {fmt(tokens.goal)}토큰 ({fmt(remaining)}토큰 남음)</div>
                                </div>
                            </div>
                        </section>

                        {/* KPIs */}
                        <section className="lgm-kpis" aria-labelledby="lgm-kpi-title">
                            <h2 id="lgm-kpi-title" className="lgm-section-title">
                                절약 지표
                            </h2>
                            <div className="lgm-kpis-grid">
                                {kpis.map((k, i) => (
                                    <div key={i} className="lgm-kpi" role="group" aria-label={k.ariaLabel || k.label}>
                                        <div className="lgm-kpi__icon" aria-hidden="true">
                                            {k.icon}
                                        </div>
                                        <div className="lgm-kpi__value">{k.value}</div>
                                        <div className="lgm-kpi__label">{k.label}</div>
                                        {k.hint && <div className="lgm-kpi__hint">{k.hint}</div>}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Timeline */}
                        <section className="lgm-card" aria-labelledby="lgm-timeline-title">
                            <h2 id="lgm-timeline-title" className="lgm-section-title" style={{ marginBottom: 8 }}>
                                🌳 나무 심기 여정
                            </h2>
                            <div className="lgm-timeline">
                                {timeline.map((t, i) => {
                                    const status = getTimelineStatus(t, i);
                                    return (
                                        <div key={i} className={`lgm-item lgm-item--${status}`}>
                                            <div className="lgm-dot" aria-hidden="true">
                                                {t.icon}
                                            </div>
                                            <div className="lgm-card-lite">
                                                <div className="lgm-item__head">
                                                    <h3 className="lgm-stage">{t.title}</h3>
                                                    <span
                                                        className={`lgm-st ${
                                                            status === "done" ? "lgm-st--done" : status === "progress" ? "lgm-st--progress" : ""
                                                        }`}
                                                    >
                            {status === "done" ? "완료" : status === "progress" ? "진행중" : "예정"}
                          </span>
                                                </div>
                                                <div className="lgm-date">{t.date}</div>
                                                <div className="lgm-desc">{t.desc}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* CTA */}
                        <section className="lgm-card lgm-cta" aria-labelledby="lgm-closing-title">
                            <h2 id="lgm-closing-title" className="lgm-section-title">
                                🌍 지구를 위한 작은 실천
                            </h2>
                            <p className="m-0 text-center" style={{ color: "var(--text-dim)" }}>
                                당신의 AI 사용 최적화는 실제 환경에 도움이 됩니다.
                                <br />
                                효율적인 대화로 에너지를 절약하고, 지구를 보호하는 일에 동참해 주셔서 감사합니다!
                            </p>
                            <div className="lgm-btns mt-2">
                                <button className="lgm-btn lgm-btn-primary" type="button" onClick={handleShare}>
                                    친구에게 공유하기
                                </button>
                                <button
                                    className="lgm-btn"
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        navigate("/chat");
                                    }}
                                >
                                    대화 계속하기
                                </button>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {/* 토스트 */}
            {toast && (
                <CustomToast
                    message={toast.msg}
                    description={toast.desc}
                    duration={1000}
                    onClose={() => setToast(null)}
                />
            )}
        </>,
        document.body
    );
}
