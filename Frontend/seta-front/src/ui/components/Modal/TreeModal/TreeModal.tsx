import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./TreeModal.css";
import type {TreeModalProps, TimelineItem} from "./types";
import { TREE_LEVELS } from "./data";
import { useNavigate } from "react-router-dom";

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

    // 공유 기능
    const handleShare = async () => {
        // KPI 데이터에서 구체적인 수치 추출
        const costSaving = kpis.find(k => k.label.includes('비용'))?.value || '₩0';
        const co2Reduction = kpis.find(k => k.label.includes('CO₂'))?.value || '0kg';
        const energySaving = kpis.find(k => k.label.includes('에너지'))?.value || '0kWh';
        const consecutiveDays = kpis.find(k => k.label.includes('연속'))?.value || '0일';

        // 달성한 나무 개수 계산
        const achievedTrees = TREE_LEVELS.filter(level => tokens.current >= level).length;
        const treeEmojis = ['🌱', '🌿', '🌳', '🌲', '🌴'];
        const achievedTreeEmojis = treeEmojis.slice(0, achievedTrees).join('');

        const shareText = `SETA Tree ${achievedTreeEmojis || '🌱'}\n\nAI 사용 최적화로 환경 보호에 기여하고 있어요!\n\n📊 내 절약 현황:\n• ${tokens.current.toLocaleString()}토큰 절약 완료\n• ${costSaving} 비용 절약\n• ${co2Reduction} CO₂ 절감\n• ${energySaving} 에너지 절약\n• ${consecutiveDays} 연속 절약\n\n작은 실천이 큰 변화를 만들어요 🌍`;

        const shareData = {
            title: 'SETA Tree - 환경을 생각하는 AI 사용',
            text: shareText,
            url: window.location.href
        };

        try {
            // Web Share API 지원 확인
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                // 폴백: 클립보드에 복사
                await handleCopyLink(shareText);
            }
        } catch (error) {
            // 사용자가 공유를 취소했거나 에러 발생 시 클립보드 복사로 폴백
            if (error instanceof Error && error.name !== 'AbortError') {
                await handleCopyLink(shareText);
            }
        }
    };

    const handleCopyLink = async (customText?: string) => {
        const shareText = customText || `SETA Tree 🌱\n저는 AI 사용을 최적화하여 ${tokens.current.toLocaleString()}토큰을 절약하며 환경 보호에 기여하고 있어요!\n\n${window.location.href}`;

        try {
            await navigator.clipboard.writeText(shareText);
            // 복사 완료 피드백 (간단한 알림)
            const button = document.querySelector('.lgm-btn-primary') as HTMLButtonElement;
            if (button) {
                const originalText = button.textContent;
                button.textContent = '링크 복사됨!';
                button.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                }, 2000);
            }
        } catch {
            // 클립보드 API 지원하지 않는 경우 텍스트 선택
            fallbackCopyToClipboard(shareText);
        }
    };

    const fallbackCopyToClipboard = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            // 복사 완료 피드백
            const button = document.querySelector('.lgm-btn-primary') as HTMLButtonElement;
            if (button) {
                const originalText = button.textContent;
                button.textContent = '텍스트 복사됨!';
                button.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                }, 2000);
            }
        } catch {
            console.log('복사 기능을 사용할 수 없습니다.');
        }

        document.body.removeChild(textArea);
    };

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

    // 타임라인 진행도 계산 수정
    useEffect(() => {
        if (!open || !shellRef.current) return;

        // 완료된 나무 개수 계산
        const completedTrees = TREE_LEVELS.filter(level => tokens.current >= level).length;
        const totalTrees = TREE_LEVELS.length;

        // 현재 진행 중인 나무의 진행도 계산
        let currentProgress = 0;
        if (completedTrees < totalTrees) {
            const currentTargetLevel = TREE_LEVELS[completedTrees];
            const prevLevel = completedTrees > 0 ? TREE_LEVELS[completedTrees - 1] : 0;
            const progressInCurrentLevel = (tokens.current - prevLevel) / (currentTargetLevel - prevLevel);
            currentProgress = (completedTrees + progressInCurrentLevel) / totalTrees;
        } else {
            currentProgress = 1; // 모든 나무 완료
        }

        shellRef.current.style.setProperty("--timeline-progress", String(Math.min(0.999, currentProgress)));
    }, [open, tokens.current]);

    if (!open) return null;

    const pct = Math.min(100, Math.round((tokens.current / tokens.goal) * 100));
    const remaining = Math.max(0, tokens.goal - tokens.current);
    const fmt = (n: number) => n.toLocaleString();

    // 나무 상태 계산 함수 수정
    const getTreeStatus = (treeIndex: number) => {
        const requiredTokens = TREE_LEVELS[treeIndex];
        return tokens.current >= requiredTokens;
    };

    // 타임라인 상태 계산 함수 수정
    const getTimelineStatus = (_timelineItem: TimelineItem, index: number) => {
        const requiredTokens = TREE_LEVELS[index];

        if (tokens.current >= requiredTokens) {
            return "done";
        } else if (index === 0 || tokens.current >= TREE_LEVELS[index - 1]) {
            return "progress";
        } else {
            return "upcoming";
        }
    };

    return createPortal(
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
                                    alt="Christmas Tree" width="50" height="50"/>
                            </div>
                            <h1 id="lgm-hero-title" className="lgm-title">MY SETA TREE</h1>
                            <div className="lgm-badge" aria-hidden="true">
                                <img
                                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Christmas%20Tree.png"
                                    alt="Christmas Tree" width="50" height="50"/>
                            </div>
                        </div>
                        <p className="lgm-subtitle">
                            AI 사용을 최적화하여 실제 환경에 기여하는 가상의 나무들입니다.<br/>
                            일정 토큰 절약마다 새로운 나무가 자라나요!
                        </p>
                    </section>

                    {/* Trees */}
                    <section className="lgm-card">
                        <div className="lgm-tree-garden">
                            {trees.map((t, i) => {
                                const isAchieved = getTreeStatus(i);
                                // 투명도 계산 개선
                                let opacity = 1;
                                if (!isAchieved) {
                                    // 다음 나무 (현재 진행 중)는 0.5, 나머지는 0.3
                                    const completedCount = TREE_LEVELS.filter(level => tokens.current >= level).length;
                                    opacity = i === completedCount ? 0.5 : 0.3;
                                }

                                return (
                                    <div key={i} className={`lgm-tree ${isAchieved ? "lgm-tree--ok" : ""}`}>
                                        <div className="lgm-tree__emoji" aria-hidden="true"
                                             style={{opacity}}>
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
                    {/* <section className="lgm-kpis" aria-labelledby="lgm-kpi-title">
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
                    </section> */}

                    {/* Timeline */}
                    <section className="lgm-card" aria-labelledby="lgm-timeline-title">
                        <h2 id="lgm-timeline-title" className="lgm-section-title" style={{marginBottom: 8}}>🌳 나무 심기 여정</h2>
                        <div className="lgm-timeline">
                            {timeline.map((t, i) => {
                                const status = getTimelineStatus(t, i);
                                const statusText = status === "done" ? "완료" : status === "progress" ? "진행중" : "예정";

                                // 날짜 동적 계산
                                let dateText = "";
                                if (status === "done") {
                                    dateText = "완료";
                                } else if (status === "progress") {
                                    dateText = "진행중";
                                } else {
                                    dateText = "예정";
                                }

                                return (
                                    <div key={i} className={`lgm-item lgm-item--${status}`}>
                                        <div className="lgm-dot" aria-hidden="true">{t.icon}</div>
                                        <div className="lgm-card-lite">
                                            <div className="lgm-item__head">
                                                <h3 className="lgm-stage">{t.title}</h3>
                                                <span
                                                    className={`lgm-st ${status === "done" ? "lgm-st--done" : status === "progress" ? "lgm-st--progress" : ""}`}>
                                                    {statusText}
                                                </span>
                                            </div>
                                            <div className="lgm-date">{dateText}</div>
                                            <div className="lgm-desc">{t.desc}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="lgm-card lgm-cta" aria-labelledby="lgm-closing-title">
                        <h2 id="lgm-closing-title" className="lgm-section-title">🌍 지구를 위한 작은 실천</h2>
                        <p className="m-0 text-center" style={{color: "var(--text-dim)"}}>
                            당신의 AI 사용 최적화는 실제 환경에 도움이 됩니다.<br/>
                            효율적인 대화로 에너지를 절약하고, 지구를 보호하는 일에 동참해 주셔서 감사합니다!
                        </p>
                        <div className="lgm-btns mt-2">
                            <button className="lgm-btn lgm-btn-primary" type="button" onClick={handleShare}>
                                공유하기
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
        </div>,
        document.body
    );
}
