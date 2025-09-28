import HomeBg from '@/assets/homebackground.png'
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import './Home.css';

const VALUES = [
    { icon: (<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Crystal%20Ball.png" alt="Crystal Ball" width="30" height="30" />), title: "효율성", strong: "낭비 없는 최적화",
        desc: "불필요한 토큰을 줄여 짧고 명확한 대화로 시간과 비용을 절약합니다.", metric: "토큰 절감 효과" },
    { icon: (<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Christmas%20Tree.png" alt="Christmas Tree" width="40" height="40" />), title: "지속 가능성", strong: "책임 있는 기술 사용",
        desc: "최적화된 사용이 에너지 절약으로 이어지고, 지속 가능한 환경을 만듭니다.", metric: "누적 CO₂ 감축 추적" },
    { icon: (<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Folded%20Hands%20Light%20Skin%20Tone.png" alt="Folded Hands Light Skin Tone" width="30" height="30" />), title: "연결성", strong: "맥락을 잇는 경험",
        desc: "채팅방이 달라도 대화가 이어지고, 모든 대화가 하나의 흐름으로 연결됩니다.", metric: "대화 간 맥락 유지" },
    { icon: (<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Shooting%20Star.png" alt="Shooting Star" width="30" height="30" />), title: "혁신", strong: "새로운 활용 패러다임",
        desc: "AI를 하나의 지능형 파트너처럼 활용하며, 대화의 방식을 새롭게 정의합니다.", metric: "AI 활용 표준화" },
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

    useEffect(() => {
        const html = document.documentElement;
        html.classList.add('hide-scrollbar');
        document.body.classList.add('hide-scrollbar');
        return () => {
            html.classList.remove('hide-scrollbar');
            document.body.classList.remove('hide-scrollbar');
        };
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
                        <h1 className="value-title">SETA가 만드는 지능형 대화의 4가지 가치</h1>
                        <h1 className="value-sub">
                            효율적이고, 지속 가능하며, 연결되고, 혁신적인 AI 경험
                        </h1>
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
