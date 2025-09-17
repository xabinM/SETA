import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import "./CarModal.css";
import type { CarModalProps } from "./types";

export default function CarModal({
                                     open,
                                     onClose,
                                     power,
                                     trip,
                                     vehicle,
                                     segments,
                                     kpis,
                                     cta,
                                 }: CarModalProps) {
    const shellRef = useRef<HTMLDivElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);

    // 진행도 계산
    const { equivKm, pct, remainingKm, totalKm, progress01 } = useMemo(() => {
        const currentKwh = power?.current ?? 0;
        const eff = vehicle?.efficiencyKmPerKwh ?? 5;
        const total = trip?.totalKm ?? 100;

        const eqKm = Math.max(0, currentKwh * eff);
        const p01 = total > 0 ? Math.max(0, Math.min(1, eqKm / total)) : 0;
        const percent = Math.round(p01 * 100);
        const remaining = Math.max(0, Math.round(total - eqKm));

        return {
            equivKm: Math.round(eqKm),
            pct: percent,
            remainingKm: remaining,
            totalKm: total,
            progress01: p01,
        };
    }, [power?.current, vehicle?.efficiencyKmPerKwh, trip?.totalKm]);

    // 세그먼트 상태
    const getSegmentStatus = (index: number) => {
        const step = power?.step ?? 20;
        const required = (index + 1) * step;
        const cur = power?.current ?? 0;
        if (cur >= required) return "done";
        if (cur >= required - step) return "progress";
        return "upcoming";
    };

    // ESC 닫기 + 스크롤 락
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    // 애니메이션: car/fill/timeline 동기
    const prevRef = useRef(0);
    useEffect(() => {
        if (!open || !shellRef.current) return;
        const root = shellRef.current;
        const prev = prevRef.current;
        const next = progress01;

        gsap.to(root, {
            duration: 0.8,
            ease: "power2.out",
            // @ts-ignore CSS 변수 애니메이션
            "--car-progress": next,
            // @ts-ignore
            "--trip-progress": next,
        });

        if (fillRef.current) {
            gsap.fromTo(
                fillRef.current,
                { width: `${prev * 100}%` },
                { width: `${next * 100}%`, duration: 0.8, ease: "power2.out" }
            );
        }

        prevRef.current = next;
    }, [open, progress01]);

    // 모달 오픈 초기값
    useEffect(() => {
        if (!open || !shellRef.current || !fillRef.current) return;
        prevRef.current = 0;
        shellRef.current.style.setProperty("--car-progress", "0");
        shellRef.current.style.setProperty("--trip-progress", "0");
        fillRef.current.style.width = "0%";
    }, [open]);

    if (!open) return null;
    const fmt = (n: number | undefined | null, unit = "") => `${(n ?? 0).toLocaleString()}${unit}`;

    return createPortal(
        <div
            className="carmodal-backdrop"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div ref={shellRef} className="carmodal-shell" role="dialog" aria-modal="true">
                <main className="cm-container">
                    {/* 닫기 */}
                    <button className="cm-close" aria-label="닫기" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                            <path d="M4.5 4.5 L13.5 13.5 M13.5 4.5 L4.5 13.5"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* HERO */}
                    <section className="cm-card cm-hero">
                        <div className="cm-header">
                            <div className="cm-icon-wrap" aria-hidden="true">
                                {/* 네가 직접 넣는 이미지/이모지 사용. width/height 지정해도 됨 */}
                                <img
                                    className="cm-emoji"
                                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Racing%20Car.png"
                                    alt="Racing Car"
                                    width="72" height="72"
                                />
                            </div>
                            <h1 className="cm-title">절약 전력으로 가는 가상 주행</h1>
                        </div>
                        <p className="cm-subtitle">
                            {trip?.origin ?? "출발지"} → {trip?.destination ?? "도착지"} 총 {fmt(totalKm, "km")} 여정.
                            <br />절약한 에너지로 <b>{fmt(equivKm, "km")}</b> 만큼 달릴 수 있어요.
                        </p>
                    </section>

                    {/* KPI */}
                    {Array.isArray(kpis) && kpis.length > 0 && (
                        <section className="cm-kpi-wrap" aria-label="핵심 지표">
                            <div className="cm-kpis-grid4">
                                {kpis.map((kpi, i) => (
                                    <div key={i} className="cm-kpi" role="group" aria-label={kpi.label}>
                                        {/* KPI 아이콘도 동일한 방식: 이미지/이모지 그대로 */}
                                        <div className="cm-kpi__icon-wrap">
                                            {kpi.icon}
                                        </div>
                                        <div className="cm-kpi__value">{kpi.value}</div>
                                        <div className="cm-kpi__label">{kpi.label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 진행도 */}
                    <section className="cm-card">
                        <div className="cm-section-head">
                            <div className="cm-icon-wrap" aria-hidden="true">
                                <img
                                    className="cm-emoji"
                                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Comet.png"
                                    alt="Comet" width="40" height="40"
                                />
                            </div>
                            <h2 className="cm-section-title">여행 진행도</h2>
                        </div>

                        <div className="cm-tripbar">
                            <div className="cm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                                <div ref={fillRef} className="cm-fill" />
                                <div className="cm-pct">{pct}%</div>

                                {/* 자동차: 막대 내부 진행 */}
                                <div className="cm-car" aria-hidden="true">
                                    <img
                                        className="cm-emoji"
                                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Racing%20Car.png"
                                        alt=""
                                    />
                                </div>
                            </div>

                            <div className="cm-meta">
                                <div className="cm-chip">등가 주행: {fmt(equivKm, "km")}</div>
                                <div className="cm-chip">목표: {fmt(totalKm, "km")} ({fmt(remainingKm, "km")} 남음)</div>
                            </div>
                        </div>
                    </section>

                    {/* 타임라인 */}
                    {Array.isArray(segments) && segments.length > 0 && (
                        <section className="cm-card">
                            <div className="cm-section-head">
                                <div className="cm-icon-wrap" aria-hidden="true">
                                    <img
                                        className="cm-emoji"
                                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/National%20Park.png"
                                        alt="National Park" width="30" height="30"
                                    />
                                </div>
                                <h2 className="cm-section-title">구간별 진행</h2>
                            </div>

                            <div className="cm-timeline">
                                {segments.map((s, i) => {
                                    const st = getSegmentStatus(i);
                                    return (
                                        <div key={i} className={`cm-item cm-item--${st}`}>
                                            <div className="cm-dot" aria-hidden="true">
                                                <span className="cm-emoji">{st === "done" ? "✅" : st === "progress" ? "🚗" : "🚙"}</span>
                                            </div>
                                            <div className="cm-card-lite">
                                                <div className="cm-item__head">
                                                    <h3 className="cm-stage">{s.title}</h3>
                                                    <span className={`cm-st ${st === "done" ? "cm-st--done" : st === "progress" ? "cm-st--progress" : ""}`}>
                            {st === "done" ? "완료" : st === "progress" ? "진행중" : "예정"}
                          </span>
                                                </div>
                                                <div className="cm-date">{fmt(s.km, "km")} 구간</div>
                                                <div className="cm-desc">
                                                    {st === "progress" ? "거의 도착!" : st === "done" ? "구간 완료" : "출발 준비"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* CTA */}
                    {cta?.share && (
                        <section className="cm-card cm-cta">
                            <div className="cm-section-head">
                                <div className="cm-icon-wrap" aria-hidden="true">
                                    <img
                                        className="cm-emoji"
                                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png"
                                        alt="Rocket" width="35" height="35"
                                    />
                                </div>
                                <h2 className="cm-section-title">작지만 큰 변화</h2>
                            </div>
                            <p className="cm-subtext">당신의 최적화는 실제 에너지 절약과 탄소 감축으로 이어지고 있어요.</p>
                            <div className="cm-btns">
                                <button className="cm-btn cm-btn-primary" type="button">공유하기</button>
                                <button className="cm-btn" type="button" onClick={onClose}>대화 계속하기</button>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>,
        document.body
    );
}
