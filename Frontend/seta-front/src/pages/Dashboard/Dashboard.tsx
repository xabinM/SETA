import { useEffect, useRef, useState, memo } from "react";
import Header from "@/ui/components/Header/Header";

// 런타임용은 auto에서, 타입은 'chart.js'에서 가져오는 패턴이 안전함
import { Chart as ChartJS } from "chart.js/auto";
import type { Chart, ChartData, ChartOptions, ChartDataset } from "chart.js";

import TreeModal from "@/ui/components/Modal/TreeModal";
import { tokens, trees, kpis, timeline } from "@/ui/components/Modal/data";
import "./Dashboard.css";

function Dashboard() {
    // 캔버스 ref
    const c1 = useRef<HTMLCanvasElement | null>(null);
    const c2 = useRef<HTMLCanvasElement | null>(null);
    const c3 = useRef<HTMLCanvasElement | null>(null);

    // 차트 인스턴스 ref (Strict Mode 대응)
    const chart1Ref = useRef<Chart | null>(null);
    const chart2Ref = useRef<Chart | null>(null);
    const chart3Ref = useRef<Chart | null>(null);

    const [open, setOpen] = useState(false); // 모달 상태

    useEffect(() => {
        // 공통 데이터/옵션 타입을 명시
        const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const baseOptions: ChartOptions<"line"> = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
        };

        const make = (ctx: CanvasRenderingContext2D, points: number[]) => {
            const dataset: ChartDataset<"line", number[]> = {
                data: points,
                borderColor: "#86efac",
                backgroundColor: "rgba(134, 239, 172, 0.1)",
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointRadius: 0,
            };

            const data: ChartData<"line", number[], string> = {
                labels,
                datasets: [dataset],
            };

            return new ChartJS(ctx, {
                type: "line",
                data,
                options: baseOptions,
            });
        };

        const initChart = (
            canvas: HTMLCanvasElement | null,
            ref: React.MutableRefObject<Chart | null>,
            points: number[]
        ) => {
            if (!canvas) return;
            ref.current?.destroy(); // Strict Mode 재마운트 대비
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ref.current = make(ctx, points);
        };

        initChart(c1.current, chart1Ref, [75, 70, 65, 60, 55, 50, 45]);
        initChart(c2.current, chart2Ref, [30, 40, 60, 65, 45, 50, 40]);
        initChart(c3.current, chart3Ref, [60, 50, 40, 30, 20, 10, 20]);

        return () => {
            chart1Ref.current?.destroy();
            chart2Ref.current?.destroy();
            chart3Ref.current?.destroy();
            chart1Ref.current = null;
            chart2Ref.current = null;
            chart3Ref.current = null;
        };
    }, []);

    return (
        <div className="dash-root">
            <Header />

            <main className="dash-main">
                <div className="dash-container">
                    {/* Overview */}
                    <h1 className="dash-title">Overview</h1>

                    <div className="dash-overview-grid">
                        <div className="dash-metric-card">
                            <div className="dash-metric-label">Saved Tokens</div>
                            <div className="dash-metric-value">12,345</div>
                        </div>
                        <div className="dash-metric-card">
                            <div className="dash-metric-label">Saved Cost</div>
                            <div className="dash-metric-value">$6,789</div>
                        </div>
                        <div className="dash-metric-card">
                            <div className="dash-metric-label">Saved CO₂</div>
                            <div className="dash-metric-value">1,234 kg</div>
                        </div>
                        <div className="dash-metric-card">
                            <div className="dash-metric-label">Saved Power</div>
                            <div className="dash-metric-value">5,678 kWh</div>
                        </div>
                    </div>

                    {/* Performance */}
                    <h2 className="dash-subtitle">Performance</h2>

                    <div className="dash-performance-grid">
                        {/* Card 1 */}
                        <div className="dash-perf-card">
                            <div className="dash-perf-head">
                                <div className="dash-perf-label">Pass/Drop Ratio</div>
                                <div className="dash-perf-value">95%</div>
                                <div className="dash-perf-meta">
                                    <span className="dash-perf-period">Last 7 days</span>
                                    <span className="dash-perf-change dash-pos">+5%</span>
                                </div>
                            </div>

                            <div className="dash-chart-area">
                                <canvas ref={c1} className="dash-chart-canvas" />
                            </div>

                            {/* 모달 열기 버튼 (원하는 위치로 옮겨도 됨) */}
                            <button
                                onClick={() => setOpen(true)}
                                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
                            >
                                나무 심기 여정 보기
                            </button>
                        </div>

                        {/* Card 2 */}
                        <div className="dash-perf-card">
                            <div className="dash-perf-head">
                                <div className="dash-perf-label">Request Processing Speed</div>
                                <div className="dash-perf-value">120 ms</div>
                                <div className="dash-perf-meta">
                                    <span className="dash-perf-period">Last 7 days</span>
                                    <span className="dash-perf-change dash-neg">-10%</span>
                                </div>
                            </div>

                            <div className="dash-chart-area">
                                <canvas ref={c2} className="dash-chart-canvas" />
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="dash-perf-card">
                            <div className="dash-perf-head">
                                <div className="dash-perf-label">Kafka Lag</div>
                                <div className="dash-perf-value">50 ms</div>
                                <div className="dash-perf-meta">
                                    <span className="dash-perf-period">Last 7 days</span>
                                    <span className="dash-perf-change dash-pos">+20%</span>
                                </div>
                            </div>

                            <div className="dash-chart-area">
                                <canvas ref={c3} className="dash-chart-canvas" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* 모달 (라우팅 없이 대시보드에서 직접 제어) */}
            <TreeModal
                open={open}
                onClose={() => setOpen(false)}
                tokens={tokens}
                trees={trees}
                kpis={kpis}
                timeline={timeline}
            />
        </div>
    );
}

export default memo(Dashboard);
