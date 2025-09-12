import Header from "@/ui/components/Header/Header";
import { memo } from "react";
import "./Dashboard.css";

/**
 * - 기존 Header 유지
 * - 화면 상단 여백은 Header가 fixed라서 paddingTop으로 확보
 * - 배경은 .constellation-bg 유틸 클래스로 처리
 */
function Dashboard() {
    return (
        <div className="min-h-screen bg-[#050806] text-white relative" style={{ fontFamily: `"Spline Sans","Noto Sans KR","Inter",sans-serif` }}>
            <div className="absolute inset-0 bg-[#050806] constellation-bg" aria-hidden />
            <Header />

            <main className="relative z-10 pt-[calc(var(--header-total)+16px)] pb-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* 상단 타이틀 */}
                    <div className="mb-8 px-1 sm:px-4">
                        <h1 className="text-4xl font-bold tracking-tight">Overview</h1>
                    </div>

                    {/* KPI 카드 4개 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1 sm:px-4">
                        {[
                            { label: "Saved Tokens", value: "12,345" },
                            { label: "Saved Cost", value: "$6,789" },
                            { label: "Saved CO₂", value: "1,234 kg" },
                            { label: "Saved Power", value: "5,678 kWh" },
                        ].map((kpi) => (
                            <div
                                key={kpi.label}
                                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 flex flex-col gap-2 transition-all duration-300 hover:border-[color:var(--primary-400)]/50 hover:bg-white/10"
                            >
                                <p className="text-gray-300 text-sm font-medium">{kpi.label}</p>
                                <p className="text-white text-3xl font-bold">{kpi.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* 섹션 타이틀 */}
                    <div className="mt-12 mb-8 px-1 sm:px-4">
                        <h2 className="text-2xl font-bold tracking-tight">Performance</h2>
                    </div>

                    {/* 성능 카드 3개 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1 sm:px-4">
                        {/* Pass/Drop Ratio (막대) */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                            <div>
                                <p className="text-gray-300 text-sm font-medium">Pass/Drop Ratio</p>
                                <p className="text-white text-4xl font-bold mt-1">95%</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-gray-400 text-sm">Last 7 days</p>
                                    <p className="text-[color:var(--primary-400)] text-sm font-medium">+5%</p>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-7 gap-3 items-end justify-items-center h-48 pt-4">
                                {[
                                    { h: "80%", d: "Mon" },
                                    { h: "10%", d: "Tue" },
                                    { h: "100%", d: "Wed" },
                                    { h: "20%", d: "Thu" },
                                    { h: "40%", d: "Fri" },
                                    { h: "80%", d: "Sat" },
                                    { h: "40%", d: "Sun" },
                                ].map(({ h, d }) => (
                                    <div key={d} className="w-full flex flex-col items-center gap-2">
                                        <div className="w-full rounded-t-lg transition-all bg-[color:var(--primary-800)]/50 hover:bg-[color:var(--primary-700)]/80" style={{ height: h }} />
                                        <p className="text-gray-400 text-xs font-bold">{d}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Request Processing Speed (면적차트) */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                            <div>
                                <p className="text-gray-300 text-sm font-medium">Request Processing Speed</p>
                                <p className="text-white text-4xl font-bold mt-1">120 ms</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-gray-400 text-sm">Last 7 days</p>
                                    <p className="text-red-400 text-sm font-medium">-10%</p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-end h-48">
                                {/* 원본 SVG 그대로 사용 */}
                                <svg className="w-full h-full" viewBox="0 0 472 150" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V150H0V109Z" fill="url(#chart1)" />
                                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="var(--primary-400)" strokeWidth="2" strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="chart1" x1="236" y1="1" x2="236" y2="149" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="var(--primary-600)" stopOpacity="0.4" />
                                            <stop offset="1" stopColor="var(--primary-950)" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="flex justify-between mt-2 text-gray-400 text-xs font-bold">
                                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d)=> <p key={d}>{d}</p>)}
                                </div>
                            </div>
                        </div>

                        {/* Kafka Lag (면적차트 동일) */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                            <div>
                                <p className="text-gray-300 text-sm font-medium">Kafka Lag</p>
                                <p className="text-white text-4xl font-bold mt-1">50 ms</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-gray-400 text-sm">Last 7 days</p>
                                    <p className="text-[color:var(--primary-400)] text-sm font-medium">+20%</p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-end h-48">
                                <svg className="w-full h-full" viewBox="0 0 472 150" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V150H0V109Z" fill="url(#chart2)" />
                                    <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="var(--primary-400)" strokeWidth="2" strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="chart2" x1="236" y1="1" x2="236" y2="149" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="var(--primary-600)" stopOpacity="0.4" />
                                            <stop offset="1" stopColor="var(--primary-950)" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="flex justify-between mt-2 text-gray-400 text-xs font-bold">
                                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d)=> <p key={d}>{d}</p>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default memo(Dashboard);
