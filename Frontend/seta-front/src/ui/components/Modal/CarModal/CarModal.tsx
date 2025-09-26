import {useEffect, useMemo, useRef} from "react";
import {createPortal} from "react-dom";
import {gsap} from "gsap";
import "./CarModal.css";
import type {CarModalProps} from "./types";
import { useNavigate } from "react-router-dom";

export default function CarModal({
                                     open,
                                     onClose,
                                     power,
                                     trip,
                                     vehicle,
                                     segments,
                                     cta,
                                 }: CarModalProps) {
    const shellRef = useRef<HTMLDivElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // 파생값 계산 - 수정됨
    const {
    currentKwh, efficiency, totalKm, equivKm, progress01, pct, remainingKm,
} = useMemo(() => {
    const currentKwh = power?.current ?? 0;
    const efficiency = vehicle?.efficiencyKmPerKwh ?? 5.2;
    const total = trip?.totalKm ?? 0;

    const eqKm = Math.max(0, currentKwh * efficiency);
    const p01 = total > 0 ? Math.max(0, Math.min(1, eqKm / total)) : 0;

    console.log('CarModal 파생값 계산:', {
        currentKwh,
        efficiency,
        totalKm: total,
        equivKm: eqKm,
        equivKmRounded: Math.max(0.1, Math.round(eqKm * 10) / 10), // 최소 0.1km 보장
        progress01: p01,
        pct: Math.round(p01 * 100)
    });

    return {
        currentKwh,
        efficiency,
        totalKm: total,
        equivKm: Math.max(0.1, Math.round(eqKm * 10) / 10), // 최소 0.1km, 소수점 1자리
        progress01: p01,
        pct: Math.round(p01 * 100),
        remainingKm: Math.max(0, Math.round(total - eqKm)),
    };
}, [power?.current, vehicle?.efficiencyKmPerKwh, trip?.totalKm]);

    // 포맷팅 함수 개선 - 작은 소수 처리
    const formatDistance = (km: number): string => {
    if (km === 0) return "0.1"; // 0일 때도 0.1로 표시
    if (km < 0.1) return "0.1";
    if (km < 1) return km.toFixed(1);
    return Math.round(km).toLocaleString();
};

    // const formatDistance = (km: number): string => {
    //     if (km === 0) return "0";
    //     if (km < 1) return km.toFixed(1);
    //     return Math.round(km).toLocaleString();
    // };

    // KPI 자동 생성 - 포맷팅 개선
    // const autoKpis =
    //     kpis && kpis.length
    //         ? kpis
    //         : [
    //             {icon: "🔋", label: "누적 전력 절약", value: `${formatKwh(currentKwh)} kWh`},
    //             {icon: "🌿", label: "CO₂ 절감", value: `${Math.round(currentKwh * 0.2 * 1000)}g`}, // g 단위로 표시
    //             {icon: "💰", label: "비용 절감", value: `${Math.round(currentKwh * 110)} 원`},
    //             {icon: "⚙️", label: "전비", value: `${efficiency.toFixed(1)} km/kWh`},
    //         ];

    // 구간 상태(단계 기준) - 실제 데이터 기반으로 계산
    const getSegmentStatus = (i: number) => {
        const totalSegments = segments?.length ?? 3;
        const segmentProgress = progress01 * totalSegments;

        if (segmentProgress > i + 1) return "done";
        if (segmentProgress > i) return "progress";
        return "upcoming";
    };

    // 공유 기능 - 더 정확한 데이터로 업데이트
    const handleShare = async () => {
        // 구체적인 성과 데이터 생성
        const costSaving = `${Math.round(currentKwh * 110).toLocaleString()}원`;
        const co2Reduction = `${Math.round(currentKwh * 0.2).toLocaleString()}kg`;
        const energySaving = `${currentKwh.toLocaleString()}kWh`;

        const shareText = `🚗 SETA 가상 드라이브\n\nAI 사용 최적화로 절약한 에너지로 가상 여행 중!\n\n📍 ${trip?.origin || "출발지"} → ${trip?.destination || "목적지"}\n🛣️ 총 거리: ${totalKm.toLocaleString()}km\n🏃‍♂️ 현재 진행: ${equivKm.toLocaleString()}km (${pct}%)\n\n⚡ 절약 현황:\n• ${energySaving} 전력 절약\n• ${costSaving} 비용 절감\n• ${co2Reduction} CO₂ 절감\n\n작은 실천이 환경을 바꿉니다! 🌍`;

        const shareData = {
            title: 'SETA 가상 드라이브 - 에너지 절약 여행',
            text: shareText,
            url: window.location.href
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await handleCopyLink(shareText);
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                await handleCopyLink(shareText);
            }
        }
    };

    const handleCopyLink = async (customText?: string) => {
        const shareText = customText || `🚗 SETA 가상 드라이브\n\n절약한 에너지로 ${trip?.origin || "출발지"}에서 ${trip?.destination || "목적지"}까지 ${equivKm.toLocaleString()}km 여행 중!\n\n${window.location.href}`;

        try {
            await navigator.clipboard.writeText(shareText);
            const button = document.querySelector('.cm-btn-primary') as HTMLButtonElement;
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
            const button = document.querySelector('.cm-btn-primary') as HTMLButtonElement;
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

    // ESC + 스크롤 락
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

    // 진행 애니메이션
    const prevRef = useRef(0);
    useEffect(() => {
        if (!open || !shellRef.current) return;
        const root = shellRef.current;
        const prev = prevRef.current;
        const next = progress01;

        console.log('진행 애니메이션:', { prev, next, progress01 });

        gsap.to(root, {
            duration: 0.8,
            ease: "power2.out",
            "--car-progress": String(next),
            "--trip-progress": String(next),
        });

        if (fillRef.current) {
            gsap.fromTo(
                fillRef.current,
                {width: `${prev * 100}%`},
                {width: `${next * 100}%`, duration: 0.8, ease: "power2.out"}
            );
        }
        prevRef.current = next;
    }, [open, progress01]);

    // 오픈 초기화
    useEffect(() => {
        if (!open || !shellRef.current || !fillRef.current) return;
        prevRef.current = 0;
        shellRef.current.style.setProperty("--car-progress", "0");
        shellRef.current.style.setProperty("--trip-progress", "0");
        fillRef.current.style.width = "0%";
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            className="carmodal-backdrop"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div ref={shellRef} className="carmodal-shell" role="dialog" aria-modal="true">
                <main className="cm-container">
                    {/* 닫기 */}
                    <button className="cm-close" aria-label="닫기" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                            <path d="M4.5 4.5 L13.5 13.5 M13.5 4.5 L4.5 13.5" stroke="currentColor" strokeWidth="2"
                                  strokeLinecap="round"/>
                        </svg>
                    </button>

                    {/* HERO */}
                    <section className="cm-card cm-hero">
                        <div className="cm-header">
                            <div className="cm-badge" aria-hidden="true">
                                <img
                                    className="cm-emoji"
                                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Racing%20Car.png"
                                    alt="Racing Car"
                                />
                            </div>
                            <div className="cm-header-text">
                                <h1 className="cm-title">절약 전력으로 가는 가상 주행</h1>
                                <p className="cm-subtitle">
                                    {(trip?.origin ?? "출발지")} → {(trip?.destination ?? "도착지")} 이 {totalKm.toLocaleString()}km 여정.
                                    <br/>
                                    절약한 에너지로 <b>{formatDistance(equivKm)}km</b> 만큼 달릴 수 있어요.
                                    <br/>
                                    <small style={{opacity: 0.8}}>현재 전비: {efficiency.toFixed(1)} km/kWh</small>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* KPI
                    {autoKpis.length > 0 && (
                        <section className="cm-kpi-wrap" aria-label="핵심 지표">
                            <div className="cm-kpis-grid4">
                                {autoKpis.map((k, i) => (
                                    <div key={i} className="cm-kpi" role="group" aria-label={k.label}>
                                        <div className="cm-kpi__icon-wrap">{k.icon}</div>
                                        <div className="cm-kpi__value">{k.value}</div>
                                        <div className="cm-kpi__label">{k.label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )} */}

                    {/* 진행도 */}
                    <section className="cm-card">
                        <div className="cm-section-head">
                            <div className="cm-icon-wrap" aria-hidden="true">
                                <img
                                    className="cm-emoji cm-emoji--cometSm"
                                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Comet.png"
                                    alt="Comet"
                                />
                            </div>
                            <h2 className="cm-section-title">여행 진행도</h2>
                        </div>

                        <div className="cm-tripbar">
                            <div className="cm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100}
                                 aria-valuenow={pct}>
                                <div ref={fillRef} className="cm-fill"/>
                                <div className="cm-pct">{pct}%</div>
                                <div className="cm-car" aria-hidden="true">
                                    <img
                                        className="cm-emoji"
                                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Racing%20Car.png"
                                        alt=""
                                    />
                                </div>
                            </div>

                            <div className="cm-meta">
                                <div className="cm-chip">등가 주행: {formatDistance(equivKm)}km</div>
                                <div className="cm-chip">목표: {totalKm.toLocaleString()}km ({remainingKm.toLocaleString()}km 남음)</div>
                                <div className="cm-chip">전비: {efficiency.toFixed(1)} km/kWh</div>
                            </div>
                        </div>
                    </section>

                    {/* 타임라인 */}
                    <section className="cm-card">
                        <div className="cm-section-head">
                            <div className="cm-icon-wrap" aria-hidden="true">
                                <img
                                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Bus%20Stop.png"
                                    alt="Bus Stop"
                                    width={25}
                                    height={25}
                                />
                            </div>
                            <h2 className="cm-section-title">구간별 진행</h2>
                        </div>

                        <div className="cm-timeline">
                            {(segments ?? []).map((seg, i) => {
                                const st = getSegmentStatus(i);
                                const statusText = st === "done" ? "완료" : st === "progress" ? "진행중" : "예정";

                                return (
                                    <div key={i} className={`cm-item cm-item--${st}`}>
                                        <div className="cm-node" aria-hidden="true">
                                            <div className="cm-node__box">
                                                <img
                                                    className="cm-node__img"
                                                    src={
                                                        i === 0
                                                            ? "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Penguin.png"
                                                            : i === 1
                                                                ? "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit.png"
                                                                : "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Whale.png"
                                                    }
                                                    alt=""
                                                />
                                            </div>
                                        </div>
                                        <div className="cm-card-lite">
                                            <div className="cm-item__head">
                                                <h3 className="cm-stage">{seg.title}</h3>
                                                <span
                                                    className={st === "done" ? "cm-st cm-st--done" : st === "progress" ? "cm-st cm-st--progress" : "cm-st"}>
                                                    {statusText}
                                                </span>
                                            </div>
                                            <div className="cm-date">{seg.km}km 구간</div>
                                            <div className="cm-desc">
                                                {st === "progress" ? "거의 도착!" : st === "done" ? "구간 완료" : "출발 준비"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* CTA */}
                    {cta?.share && (
                        <section className="cm-card cm-cta" aria-labelledby="cm-cta-title">
                            <div className="cm-cta-grid">
                                <div className="cm-cta-copy">
                                    <div className="cm-section-head">
                                        <div className="cm-icon-wrap" aria-hidden="true">
                                            <img
                                                className="cm-emoji cm-emoji--cometSm"
                                                src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png"
                                                alt="Rocket"
                                            />
                                        </div>
                                        <h2 id="cm-cta-title" className="cm-section-title">작지만 큰 변화</h2>
                                    </div>
                                    <p className="cm-cta-text">당신의 최적화는 실제 에너지 절약과 탄소 감축으로 이어지고 있어요.</p>
                                </div>

                                <div className="cm-btns cm-btns--cta">
                                    <button className="cm-btn cm-btn-primary" type="button" onClick={handleShare}>
                                        공유하기
                                    </button>
                                    <button
                                        className="cm-btn"
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            navigate("/chat");
                                        }}
                                    >
                                        대화 계속하기
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>,
        document.body
    );
}
