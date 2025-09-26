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
                        필요 없는 것을 덜어내고, 꼭 필요한 것만 남기는 것.
                        SETA는 단순한 절약을 넘어, 우리의 삶과 환경을 지키는 새로운 방식을 제시합니다.
                        오늘의 작은 실천이 내일의 더 큰 변화를 만들어갑니다.
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