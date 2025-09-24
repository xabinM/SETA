import HomeBg from '@/assets/homebackground.png'
import {useNavigate} from "react-router-dom";
import './Home.css';

export default function Home() {
    const navigate = useNavigate()

    return (
        <div
            className="home-container"
            style={{
                backgroundImage: `url('${HomeBg}')`,
            }}
        >

            <div className="home-overlay"/>

            <main className="home-main">
                <section className="home-content">
                    <h1 className="home-title">
                        AI로 밝히는 지속가능한 미래
                    </h1>

                    <p className="home-description">
                        SETA는 최첨단 인공지능 기술을 활용하여 다양한 산업 분야의 에너지 소비를 최적화하는 혁신적인
                        플랫폼입니다. 실행 가능한 인사이트와 자동화된 제어를 통해 에너지 낭비를 줄이고, 비용을 절감하며,
                        지속 가능성을 향상시킵니다.
                    </p>

                    <div className="home-buttons">
                        <button
                            className="btn-primary"
                            onClick={() => navigate("/login")}
                        >
                            시작하기
                        </button>

                        <button className="btn-secondary">
                            더 알아보기
                        </button>
                    </div>
                </section>
            </main>
        </div>
    )
}