import { memo, useState } from "react";
import Header from "@/ui/components/Header/Header";
import { Icon } from "@iconify/react";
import ChatBg from "@/assets/ChatBackground.png";

/* ===== Modals ===== */
import TreeModal from "@/ui/components/Modal/TreeModal/TreeModal";
import { treeModalDataByScope } from "@/ui/components/Modal/TreeModal/data.ts";
import CarModal from "@/ui/components/Modal/CarModal/CarModal";
import { mockCarModalData } from "@/ui/components/Modal/CarModal/data";

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
            <div className="seg-thumb" aria-hidden="true" />
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

    // ✅ 현재 scope에 맞는 TreeModal 데이터 선택
    const { tokens, trees, kpis, timeline } = treeModalDataByScope[scope];

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
            <Header />

            <main className="dash-main">
                {/* ✅ Scope Toggle: lg-page 바깥에 위치 (overflow clipping 영향 X) */}
                <div className="scope-dock--tr">
                    <ScopeChipGroup value={scope} onChange={setScope} />
                </div>

                <div className="lg-page">
                    {/* floating blobs */}
                    <div className="lg-blob lg-a" />
                    <div className="lg-blob lg-b" />
                    <div className="lg-blob lg-c" />

                    <div className="lg-container">
                        {/* ===== Stats ===== */}
                        <section className="lg-grid lg-stats" aria-label="주요 지표">
                            {/* Stat 1 */}
                            <article className="lg-card lg-stat-card">
                                <div className="lg-icon lg-i-ink" aria-hidden="true">
                                    {/* target */}
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
                                        <circle cx="12" cy="12" r="9" />
                                        <circle cx="12" cy="12" r="5" />
                                        <circle cx="12" cy="12" r="1.5" />
                                    </svg>
                                </div>
                                <div className="lg-stat-title">절약한 토큰 수</div>
                                <div className="lg-stat-value">
                                    {scope === "me" ? "1,247" : "13,442"}
                                </div>
                                <div className="lg-stat-delta">
                                    {scope === "me" ? "+23개 (오늘)" : "+264개 (오늘)"}
                                </div>
                            </article>

                            {/* Stat 2 */}
                            <article className="lg-card lg-stat-card">
                                <div className="lg-icon lg-i-amber" aria-hidden="true">
                                    {/* coin */}
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
                                        <ellipse cx="12" cy="5" rx="7" ry="3" />
                                        <path d="M19 5v6c0 1.66-3.13 3-7 3s-7-1.34-7-3V5" />
                                        <path d="M19 11v6c0 1.66-3.13 3-7 3s-7-1.34-7-3v-6" />
                                    </svg>
                                </div>
                                <div className="lg-stat-title">절감된 비용</div>
                                <div className="lg-stat-value">
                                    {scope === "me" ? "₩2,480" : "₩27,350"}
                                </div>
                                <div className="lg-stat-delta">
                                    {scope === "me" ? "+₩46 (오늘)" : "+₩512 (오늘)"}
                                </div>
                            </article>

                            {/* Stat 3 */}
                            <article className="lg-card lg-stat-card">
                                <div className="lg-icon lg-i-green" aria-hidden="true">
                                    {/* leaf */}
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
                                        <path d="M11 4c2.5 0 7-1 9 1 2 2-1 6-3 8-2 2-6 5-8 3S7 10 9 8s1-4 2-4Z" />
                                        <path d="M2 22s3-3 7-7 7-7 7-7" />
                                    </svg>
                                </div>
                                <div className="lg-stat-title">CO₂ 절감량</div>
                                <div className="lg-stat-value">
                                    {scope === "me" ? "0.8kg" : "9.1kg"}
                                </div>
                                <div className="lg-stat-delta">
                                    {scope === "me" ? "+0.02kg (오늘)" : "+0.21kg (오늘)"}
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
                                            style={{ marginLeft: 6 }}
                                        >
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
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
                                        {scope === "me"
                                            ? "절약한 토큰으로 3그루의 나무를 심었어요!"
                                            : "모두 함께 36그루의 나무를 심었어요!"}
                                    </div>
                                    <div className="lg-dim">
                                        {scope === "me"
                                            ? "다음 나무까지 247토큰 남았습니다."
                                            : "다음 나무까지 1,122토큰 남았습니다."}
                                    </div>
                                    <div className="lg-dot-row" aria-hidden="true">
                                        <span className="lg-dot" />
                                        <span className="lg-dot" />
                                        <span className="lg-dot" />
                                        <span className="lg-dot lg-dim-dot" />
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
                                            style={{ marginLeft: 6 }}
                                        >
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
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
                                    <div style={{ lineHeight: 1.65 }}>
                                        <div className="lg-strong">전기를 아껴서</div>
                                        <div className="lg-em">
                                            {scope === "me" ? "서울 → 대전" : "서울 → 부산"}
                                        </div>
                                        <div className="lg-dim">
                                            ({scope === "me" ? "140km" : "325km"}) 갈 수 있는
                                        </div>
                                        <div className="lg-strong">에너지를 절약했어요!</div>
                                    </div>
                                </div>
                            </article>
                        </section>

                        {/* ===== Ranking ===== */}
                        <section className="lg-card lg-ranking" aria-label="불용어 절약 TOP 5">
                            <div className="lg-ranking-head">
                                <div className="lg-ranking-title">
                                    <Icon icon="fluent-emoji:trophy" width={28} height={28} />
                                    <h2>불용어 절약 TOP 5</h2>
                                </div>
                                <span className="lg-pill">
                  {scope === "me" ? "개인 기준" : "전체 기준"}
                </span>
                            </div>

                            <div className="lg-ranking-inner">
                                {/* 1 */}
                                <article className="lg-card lg-rank-card">
                                    <div className="lg-badge" title="1위">
                                        <Icon icon="fluent-emoji:1st-place-medal" width={24} height={24} />
                                    </div>
                                    <h4>그런데</h4>
                                    <p>{scope === "me" ? "47회 절약" : "512회 절약"}</p>
                                </article>
                                {/* 2 */}
                                <article className="lg-card lg-rank-card">
                                    <div className="lg-badge" title="2위">
                                        <Icon icon="fluent-emoji:2nd-place-medal" width={24} height={24} />
                                    </div>
                                    <h4>그리고</h4>
                                    <p>{scope === "me" ? "38회 절약" : "403회 절약"}</p>
                                </article>
                                {/* 3 */}
                                <article className="lg-card lg-rank-card">
                                    <div className="lg-badge" title="3위">
                                        <Icon icon="fluent-emoji:3rd-place-medal" width={24} height={24} />
                                    </div>
                                    <h4>그래서</h4>
                                    <p>{scope === "me" ? "31회 절약" : "376회 절약"}</p>
                                </article>
                                {/* 4 */}
                                <article className="lg-card lg-rank-card">
                                    <div className="lg-badge" title="4위">
                                        <span className="lg-keycap">4️⃣</span>
                                    </div>
                                    <h4>하지만</h4>
                                    <p>{scope === "me" ? "29회 절약" : "351회 절약"}</p>
                                </article>
                                {/* 5 */}
                                <article className="lg-card lg-rank-card">
                                    <div className="lg-badge" title="5위">
                                        <span className="lg-keycap">5️⃣</span>
                                    </div>
                                    <h4>그러면</h4>
                                    <p>{scope === "me" ? "24회 절약" : "288회 절약"}</p>
                                </article>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* ===== TreeModal ===== */}
            <TreeModal
                open={isTreeModalOpen}
                onClose={() => setIsTreeModalOpen(false)}
                tokens={tokens}
                trees={trees}
                kpis={kpis}
                timeline={timeline}
            />

            {/* ===== CarModal ===== */}
            <CarModal
                open={isCarModalOpen}
                onClose={() => setIsCarModalOpen(false)}
                {...mockCarModalData}
            />
        </div>
    );
}

export default memo(Dashboard);
