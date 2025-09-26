import HomeBg from '@/assets/homebackground.png'
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import './Home.css';

const VALUES = [
    { icon: "💡", title: "효율성", strong: "불필요한 토큰을 줄여 실제 비용을 낮춥니다.",
        desc: "모델 호출 전·중·후 최적화로 의미 없는 토큰을 차단합니다.", metric: "평균 ₩2.0/토큰 기준" },
    { icon: "🌍", title: "지속 가능성", strong: "덜 쓰는 만큼 CO₂ 발자국도 줄어듭니다.",
        desc: "토큰 절감 → 연산 에너지 절감 → 탄소 감축으로 이어집니다.", metric: "누적 CO₂ 감축 추적" },
    { icon: "🤝", title: "함께 성장", strong: "개인도, 팀도 더 빠르고 가볍게.",
        desc: "개발·PM·재무 모두가 체감하는 공용 지표를 제공합니다.", metric: "온보딩 ~15분" },
    { icon: "🚀", title: "혁신", strong: "AI 사용의 새 표준을 만듭니다.",
        desc: "정책·프롬프트·로깅을 한곳에서 관리하고 자동 최적화합니다.", metric: "TTV 단축" },
];

export default function Home() {
    const navigate = useNavigate();
    const valueRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = valueRef.current;
        if (!el) return;
        const cards = el.querySelectorAll<HTMLElement>(".v-card");
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add("reveal"); io.unobserve(e.target); }
            });
        }, { threshold: 0.15 });
        cards.forEach(c => io.observe(c));
        return () => io.disconnect();
    }, []);

    const scrollToValues = () => valueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    return (
        <div className="home-container" style={{ backgroundImage: `url('${HomeBg}')` }}>
            <div className="home-overlay" />

            <main className="home-main">
                {/* 히어로 */}
                <section className="home-content">
                    <h1 className="home-title">AI로 밝히는 지속가능한 미래</h1>
                    <p className="home-description">
                        필요 없는 것을 덜어내고, 꼭 필요한 것만 남기는 것. SETA는 단순한 절약을 넘어,
                        우리의 삶과 환경을 지키는 새로운 방식을 제시합니다. 오늘의 작은 실천이 내일의 더 큰 변화를 만들어갑니다.
                    </p>
                    <div className="home-buttons">
                        <button className="btn-primary" onClick={() => navigate("/login")}>시작하기</button>
                        <button className="btn-secondary" onClick={scrollToValues}>더 알아보기</button>
                    </div>
                </section>

                {/* 가치 섹션 */}
                <section
                    id="values"
                    className="value-section"
                    ref={valueRef}
                    aria-label="SETA의 핵심 가치"
                >
                    <header className="value-head value-head--tight">
                        <h2 className="value-title">SETA는 이렇게 가치가 됩니다</h2>
                        <p className="value-sub">
                            왜(문제) → 무엇(해결) → 어떤 임팩트(지표)로 연결되는지 한눈에 보세요.
                        </p>
                    </header>

                    <div className="value-grid value-grid--uniform">
                        {VALUES.map((v, i) => (
                            <article
                                key={v.title}
                                className="v-card v-card--uniform"
                                style={{ transitionDelay: `${i * 80}ms` }}
                                role="article"
                                aria-labelledby={`value-${i}-title`}
                            >
                                <header className="v-top">
                                    <div className="v-icon" aria-hidden="true">{v.icon}</div>
                                    <h3 id={`value-${i}-title`} className="v-title">{v.title}</h3>
                                </header>

                                <div className="v-body">
                                    <p className="v-strong">{v.strong}</p>
                                    <p className="v-desc">{v.desc}</p>
                                </div>

                                {v.metric && (
                                    <footer className="v-foot">
                                        <span className="v-chip">{v.metric}</span>
                                    </footer>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
