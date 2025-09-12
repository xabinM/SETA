import { useEffect, useRef, memo } from "react";
import Header from "@/ui/components/Header/Header";
import Chart from "chart.js/auto";
import "./Dashboard.css";

function Dashboard() {
    const c1 = useRef<HTMLCanvasElement | null>(null);
    const c2 = useRef<HTMLCanvasElement | null>(null);
    const c3 = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const make = (ctx: CanvasRenderingContext2D, data: number[]) =>
            new Chart(ctx, {
                type: "line",
                data: {
                    labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                    datasets: [{
                        data,
                        borderColor: "#86efac",
                        backgroundColor: "rgba(134, 239, 172, 0.1)",
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { display: false }, y: { display: false } }
                }
            });

        const i1 = c1.current && make(c1.current.getContext("2d")!, [75,70,65,60,55,50,45]);
        const i2 = c2.current && make(c2.current.getContext("2d")!, [30,40,60,65,45,50,40]);
        const i3 = c3.current && make(c3.current.getContext("2d")!, [60,50,40,30,20,10,20]);

        return () => {
            i1 && i1.destroy();
            i2 && i2.destroy();
            i3 && i3.destroy();
        };
    }, []);

    return (
        <div className="dash-root">
            {/* 네가 쓰던 Header 그대로 사용 */}
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

                            <div className="dash-week">
                                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                                    <span key={d} className="dash-day">{d}</span>
                                ))}
                            </div>
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

                            <div className="dash-week">
                                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                                    <span key={d} className="dash-day">{d}</span>
                                ))}
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

                            <div className="dash-week">
                                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                                    <span key={d} className="dash-day">{d}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default memo(Dashboard);
