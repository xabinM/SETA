import {memo, useState, useMemo} from "react";
import Header from "@/ui/components/Header/Header";
import {Icon} from "@iconify/react";
import ChatBg from "@/assets/ChatBackground.png";

// hooks와 유틸리티 함수들 import
import { useDashboardKpi, formatNumber, formatCost, formatCO2 } from "@/features/dashboard/hooks";

/* ===== Modals ===== */
import TreeModal from "@/ui/components/Modal/TreeModal/TreeModal";
import {
    treeModalDataByScope, 
    calculateTreeStatus, 
    calculateNextGoal, 
    calculateCurrentStep,
    TREE_LEVELS
} from "@/ui/components/Modal/TreeModal/data";
import CarModal from "@/ui/components/Modal/CarModal/CarModal";
import { createCarModalData } from "@/ui/components/Modal/CarModal/data";

/* ===== Styles ===== */
import "./Dashboard.css";

/* ================= Scope Toggle (Glass Segmented) ================= */
function ScopeChipGroup({
                            value,
                            onChange,
                        }: {
    value: "me" | "all";
    onChange: (v: "me" | "all") => void;
}) {
    return (
        <div className="seg" role="tablist" aria-label="범위 전환" data-active={value}>
            <div className="seg-thumb" aria-hidden="true"/>
            <button
                type="button"
                role="tab"
                aria-selected={value === "me"}
                className="seg-btn"
                onClick={() => onChange("me")}
            >
                개인
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={value === "all"}
                className="seg-btn"
                onClick={() => onChange("all")}
            >
                전체
            </button>
        </div>
    );
}

function Dashboard() {
    const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
    const [isCarModalOpen, setIsCarModalOpen] = useState(false);

    // 개인/전체 전환 상태
    const [scope, setScope] = useState<"me" | "all">("me");

    // API 데이터 가져오기
    const { data, loading, error, refetch } = useDashboardKpi();

    // CarModal 데이터 생성 (API 데이터 기반)
    const carModalData = useMemo(() => {
        if (!data) return null;
        const currentStats = scope === "me" ? data.userTotal : data.globalTotal;
        return createCarModalData(currentStats.savedTokens, scope);
    }, [data, scope]);

    // 로딩 상태
    if (loading) {
        return (
            <div className="dash-root" style={{
                backgroundImage: `url(${ChatBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
            }}>
                <Header/>
                <main className="dash-main">
                    <div className="lg-page">
                        <div className="lg-container">
                            <div className="lg-center" style={{ marginTop: "100px" }}>
                                <div className="lg-strong">데이터를 불러오는 중...</div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // 에러 상태
    if (error || !data) {
        return (
            <div className="dash-root" style={{
                backgroundImage: `url(${ChatBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
            }}>
                <Header/>
                <main className="dash-main">
                    <div className="lg-page">
                        <div className="lg-container">
                            <div className="lg-center" style={{ marginTop: "100px" }}>
                                <div className="lg-strong">데이터를 불러오는데 실패했습니다</div>
                                <div className="lg-dim">{error}</div>
                                <button className="lg-btn" onClick={refetch} style={{ marginTop: "16px" }}>
                                    다시 시도
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // scope에 따른 데이터 선택
    const currentStats = scope === "me" ? data.userTotal : data.globalTotal;
    const currentDaily = scope === "me" ? data.userDaily : data.globalDaily;
    console.log("Current scope:", scope);
    console.log("Current stats:", currentStats);
    console.log("Cost sum USD:", currentStats.costSumUsd);
    

    // TreeModal용 데이터 준비 (API 데이터 기반)
    const baseData = treeModalDataByScope[scope];
    const currentSavedTokens = currentStats.savedTokens;
    
    // API 데이터로 TreeModal 데이터 업데이트
    const tokens = {
        current: currentSavedTokens,
        goal: calculateNextGoal(currentSavedTokens),
        step: calculateCurrentStep(currentSavedTokens)
    };
    
    const trees = calculateTreeStatus(currentSavedTokens);
    
    const kpis = baseData.kpis.map((kpi) => {
        if (kpi.label === "누적 비용 절약") {
            return { ...kpi, value: formatCost(currentStats.costSumUsd) };
        }
        if (kpi.label === "CO₂ 절감량") {
            return { ...kpi, value: formatCO2(currentSavedTokens) };
        }
        return kpi;
    });
    
    const timeline = baseData.timeline;

    // 교통수단 카드의 목적지 계산
    const getDestinationByTokens = (savedTokens: number) => {
        const powerKwh = savedTokens / 1000;
        const maxKm = Math.round(powerKwh * 5.2);
        
        if (maxKm < 150) return { destination: "대전", distance: "140km" };
        if (maxKm < 320) return { destination: "대구", distance: "290km" };
        if (maxKm < 500) return { destination: "부산", distance: "325km" };
        if (maxKm < 1000) return { destination: "제주", distance: "470km" };
        if (maxKm < 1200) return { destination: "상하이", distance: "950km" };
        return { destination: "도쿄", distance: "1160km" };
    };

    const destinationInfo = getDestinationByTokens(currentSavedTokens);

    return (
        <div
            className="dash-root"
            style={{
                backgroundImage: `url(${ChatBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
            }}
        >
            <Header/>

            <main className="dash-main">
                {/* Scope Toggle */}
                <div className="scope-dock--tr">
                    <ScopeChipGroup value={scope} onChange={setScope}/>
                </div>

                <div className="lg-page">
                    {/* floating blobs */}
                    <div className="lg-blob lg-a"/>
                    <div className="lg-blob lg-b"/>
                    <div className="lg-blob lg-c"/>

                    <div className="lg-container">
                        {/* ===== Stats ===== */}
                        <section className="lg-grid lg-stats" aria-label="주요 지표">
                            {/* Stat 1 - 절약한 토큰 수 */}
                            <article className="lg-card lg-stat-card">
                                <div className="lg-icon lg-i-ink" aria-hidden="true">
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="9"/>
                                        <circle cx="12" cy="12" r="5"/>
                                        <circle cx="12" cy="12" r="1.5"/>
                                    </svg>
                                </div>
                                <div className="lg-stat-title">절약한 토큰 수</div>
                                <div className="lg-stat-value">
                                    {formatNumber(currentStats.savedTokens)}
                                </div>
                                <div className="lg-stat-delta">
                                    +{formatNumber(currentDaily.savedTokens)}개 (오늘)
                                </div>
                            </article>

                            {/* Stat 2 - 절감된 비용 */}
                            <article className="lg-card lg-stat-card">
                                <div className="lg-icon lg-i-amber" aria-hidden="true">
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <ellipse cx="12" cy="5" rx="7" ry="3"/>
                                        <path d="M19 5v6c0 1.66-3.13 3-7 3s-7-1.34-7-3V5"/>
                                        <path d="M19 11v6c0 1.66-3.13 3-7 3s-7-1.34-7-3v-6"/>
                                    </svg>
                                </div>
                                <div className="lg-stat-title">절감된 비용</div>
                                <div className="lg-stat-value">
                                    {formatCost(currentStats.costSumUsd)}
                                </div>
                                <div className="lg-stat-delta">
                                    +{formatCost(currentDaily.costSumUsd)} (오늘)
                                </div>
                            </article>

                            {/* Stat 3 - CO2 절감량 */}
                            <article className="lg-card lg-stat-card">
                                <div className="lg-icon lg-i-green" aria-hidden="true">
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M11 4c2.5 0 7-1 9 1 2 2-1 6-3 8-2 2-6 5-8 3S7 10 9 8s1-4 2-4Z"/>
                                        <path d="M2 22s3-3 7-7 7-7 7-7"/>
                                    </svg>
                                </div>
                                <div className="lg-stat-title">CO₂ 절감량</div>
                                <div className="lg-stat-value">
                                    {formatCO2(currentStats.savedTokens)}
                                </div>
                                <div className="lg-stat-delta">
                                    +{formatCO2(currentDaily.savedTokens)} (오늘)
                                </div>
                            </article>
                        </section>

                        {/* ===== Details ===== */}
                        <section className="lg-grid lg-details" aria-label="상세 정보">
                            {/* Trees */}
                            <article className="lg-card lg-detail-card">
                                <div className="lg-detail-head">
                                    <div className="lg-detail-title">
                                        <img
                                            src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Christmas%20Tree.png"
                                            alt="Christmas Tree"
                                            width="28"
                                            height="28"
                                        />
                                        <h2>나무 심기 현황</h2>
                                    </div>
                                    <button
                                        className="lg-btn"
                                        type="button"
                                        aria-label="나무 심기 현황 상세보기"
                                        onClick={() => setIsTreeModalOpen(true)}
                                    >
                                        상세보기
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            style={{marginLeft: 6}}
                                        >
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>
                                </div>

                                <div className="lg-center" aria-live="polite">
                                    <img
                                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Christmas%20Tree.png"
                                        alt="Christmas Tree"
                                        width="72"
                                        height="72"
                                    />
                                    <div className="lg-strong">
                                        절약한 토큰으로 {TREE_LEVELS.filter(level => currentSavedTokens >= level).length}그루의 나무를 심었어요!
                                    </div>
                                    <div className="lg-dim">
                                        다음 나무까지 {Math.max(0, tokens.goal - tokens.current)}토큰 남았습니다.
                                    </div>
                                    <div className="lg-dot-row" aria-hidden="true">
                                        {TREE_LEVELS.map((level, index) => (
                                            <span 
                                                key={index} 
                                                className={`lg-dot ${currentSavedTokens >= level ? '' : 'lg-dim-dot'}`} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            </article>

                            {/* Transport */}
                            <article className="lg-card lg-detail-card">
                                <div className="lg-detail-head">
                                    <div className="lg-detail-title">
                                        <img
                                            src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Racing%20Car.png"
                                            alt="Racing Car"
                                            width="28"
                                            height="28"
                                        />
                                        <h2>교통수단 절약 효과</h2>
                                    </div>
                                    <button
                                        className="lg-btn"
                                        type="button"
                                        aria-label="교통수단 절약 효과 상세보기"
                                        onClick={() => setIsCarModalOpen(true)}
                                    >
                                        상세보기
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            style={{marginLeft: 6}}
                                        >
                                            <path d="M5 12h14"/>
                                            <path d="m12 5 7 7-7 7"/>
                                        </svg>
                                    </button>
                                </div>

                                <div className="lg-center">
                                    <img
                                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Racing%20Car.png"
                                        alt="Racing Car"
                                        width="72"
                                        height="72"
                                    />
                                    <div style={{lineHeight: 1.65}}>
                                        <div className="lg-strong">전기를 아껴서</div>
                                        <div className="lg-em">
                                            서울 → {destinationInfo.destination}
                                        </div>
                                        <div className="lg-dim">
                                            ({destinationInfo.distance}) 갈 수 있는
                                        </div>
                                        <div className="lg-strong">에너지를 절약했어요!</div>
                                    </div>
                                </div>
                            </article>
                        </section>

                        {/* ===== Ranking ===== */}
                        <section className="lg-card lg-ranking" aria-label={scope === "me" ? "개인 불용어 절약 TOP 5" : "전체 절약 이유 TOP 5"}>
                            <div className="lg-ranking-head">
                                <div className="lg-ranking-title">
                                    <Icon icon="fluent-emoji:trophy" width={28} height={28}/>
                                    <h2>{scope === "me" ? "불용어 절약 TOP 5" : "절약 이유 TOP 5"}</h2>
                                </div>
                                <span className="lg-pill">
                                    {scope === "me" ? "개인 기준" : "전체 기준"}
                                </span>
                            </div>

                            <div className="lg-ranking-inner">
                                {scope === "me" ? (
                                    // 개인 모드: topDroppedTexts 사용
                                    data.topDroppedTexts.slice(0, 5).map((item, index) => (
                                        <article key={item.droppedText} className="lg-card lg-rank-card">
                                            <div className="lg-badge" title={`${index + 1}위`}>
                                                {index < 3 ? (
                                                    <Icon
                                                        icon={`fluent-emoji:${index + 1}${
                                                            index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'
                                                        }-place-medal`}
                                                        width={24}
                                                        height={24}
                                                    />
                                                ) : (
                                                    <span className="lg-keycap">{index + 1}️⃣</span>
                                                )}
                                            </div>
                                            <h4>{item.droppedText}</h4>
                                            <p>{item.count}회 절약</p>
                                        </article>
                                    ))
                                ) : (
                                    // 전체 모드: topReasons 사용  
                                    data.topReasons.slice(0, 5).map((item, index) => (
                                        <article key={item.reasonType} className="lg-card lg-rank-card">
                                            <div className="lg-badge" title={`${index + 1}위`}>
                                                {index < 3 ? (
                                                    <Icon
                                                        icon={`fluent-emoji:${index + 1}${
                                                            index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'
                                                        }-place-medal`}
                                                        width={24}
                                                        height={24}
                                                    />
                                                ) : (
                                                    <span className="lg-keycap">{index + 1}️⃣</span>
                                                )}
                                            </div>
                                            <h4>{item.reasonType}</h4>
                                            <p>{item.count}회</p>
                                        </article>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* ===== TreeModal (API 데이터 연동) ===== */}
            <TreeModal
                open={isTreeModalOpen}
                onClose={() => setIsTreeModalOpen(false)}
                tokens={tokens}
                trees={trees}
                kpis={kpis}
                timeline={timeline}
            />

            {/* ===== CarModal (API 데이터 연동) ===== */}
            {carModalData && (
                <CarModal
                    open={isCarModalOpen}
                    onClose={() => setIsCarModalOpen(false)}
                    {...carModalData}
                />
            )}
        </div>
    );
}

export default memo(Dashboard);