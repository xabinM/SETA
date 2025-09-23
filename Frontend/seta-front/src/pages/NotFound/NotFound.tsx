import './NotFound.css';

export default function NotFound() {
    const handleGoHome = () => {
        window.location.href = '/home';
    };

    return (
        <main className="main">
            <div className="container">
                <div>
                    <h1 className="title">404</h1>
                    <div className="line"></div>
                </div>

                <div>
                    <h2 className="heading">
                        페이지를 찾을 수 없습니다
                    </h2>
                    <p className="description">
                        요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
                        <br />
                        다시 확인해주세요.
                    </p>
                </div>

                <button className="button" onClick={handleGoHome}>
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    홈으로 돌아가기
                </button>

                <div className="dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                </div>
            </div>
        </main>
    );
}