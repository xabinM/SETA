import { Header } from '@/ui/components/Header'
import HomeBg from '@/assets/homebackground.png'
import {useNavigate} from "react-router-dom";

export default function Home() {
    const navigate = useNavigate()

    return (
        <div
            className="relative min-h-screen overflow-hidden" // ← bg-black 제거
            style={{
                backgroundImage: `url('${HomeBg}')`,            // ← 배경을 최상단 컨테이너에 직접 적용
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <Header />

            {/* 반투명 오버레이 (그대로) */}
            <div className="absolute inset-0 bg-black/40 z-10" />

            {/* 본문 (그대로) */}
            <main className="relative z-10 flex items-center justify-center min-h-screen px-4">
                <section className="flex flex-col items-center text-center max-w-6xl mx-auto">
                    <h1
                        className="font-black tracking-tight"
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            fontSize: 'clamp(48px, 8vw, 72px)',
                            lineHeight: '1.1',
                            letterSpacing: '-0.04em',
                            background:
                                'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(156,163,175,1) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '24px',
                        }}
                    >
                        AI로 밝히는 지속가능한 미래
                    </h1>

                    <p
                        className="text-white/80 mx-auto"
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            maxWidth: '860px',
                            fontSize: 'clamp(16px, 2.5vw, 20px)',
                            lineHeight: '1.6',
                            marginBottom: '32px',
                        }}
                    >
                        SETA는 최첨단 인공지능 기술을 활용하여 다양한 산업 분야의 에너지 소비를 최적화하는 혁신적 인
                        플랫폼입니다. 실행 가능한 인사이트와 자동화된 제어를 통해 에너지 낭비를 줄이고, 비용을 절감하며,
                        지속 가능성을 향상시킵니다.
                    </p>

                    <div className="flex items-center justify-center" style={{ gap: 'clamp(12px, 2vw, 16px)' }}>
                        <button
                            className="font-bold focus:outline-none"
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                padding: 'clamp(10px, 2.5vw, 13px) clamp(20px, 5vw, 30px)',
                                borderRadius: '9999px',
                                backgroundColor: '#38E07B',
                                color: '#000',
                                boxShadow: '0px 2px 8px rgba(56, 224, 123, 0.3)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: 'translateY(0px)',
                                cursor: 'pointer',
                                fontSize: 'clamp(14px, 2.5vw, 16px)',
                            }}
                            onMouseEnter={(e) => {
                                const t = e.currentTarget as HTMLButtonElement
                                t.style.transform = 'translateY(-2px)'
                                t.style.boxShadow = '0px 8px 25px rgba(56, 224, 123, 0.4)'
                                t.style.backgroundColor = '#32D374'
                            }}
                            onMouseLeave={(e) => {
                                const t = e.currentTarget as HTMLButtonElement
                                t.style.transform = 'translateY(0px)'
                                t.style.boxShadow = '0px 2px 8px rgba(56, 224, 123, 0.3)'
                                t.style.backgroundColor = '#38E07B'
                            }}

                            onClick={() => navigate("/login")}
                        >
                            시작하기
                        </button>

                        <button
                            className="focus:outline-none"
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                padding: 'clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 26px)',
                                borderRadius: '9999px',
                                background: 'rgba(255,255,255,0.10)',
                                border: '1px solid rgba(255,255,255,0.20)',
                                color: 'rgba(255,255,255,0.92)',
                                boxShadow: '0px 2px 8px rgba(255,255,255,0.1)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: 'translateY(0px)',
                                cursor: 'pointer',
                                fontSize: 'clamp(14px, 2.5vw, 16px)',
                            }}
                            onMouseEnter={(e) => {
                                const t = e.currentTarget as HTMLButtonElement
                                t.style.transform = 'translateY(-2px)'
                                t.style.background = 'rgba(255,255,255,0.15)'
                                t.style.borderColor = 'rgba(255,255,255,0.30)'
                                t.style.boxShadow = '0px 8px 25px rgba(255,255,255,0.15)'
                            }}
                            onMouseLeave={(e) => {
                                const t = e.currentTarget as HTMLButtonElement
                                t.style.transform = 'translateY(0px)'
                                t.style.background = 'rgba(255,255,255,0.10)'
                                t.style.borderColor = 'rgba(255,255,255,0.20)'
                                t.style.boxShadow = '0px 2px 8px rgba(255,255,255,0.1)'
                            }}
                        >
                            더 알아보기
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}
