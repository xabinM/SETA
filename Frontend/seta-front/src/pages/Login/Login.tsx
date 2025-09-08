import LoginBg from "@/assets/loginBackground.png";
import "./Login.css";

export default function Login() {
    return (
        <div
            className="login-page relative min-h-screen overflow-hidden"
            style={{
                backgroundImage: `url(${LoginBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="absolute inset-0 bg-black/40 z-10" />

            <main className="relative z-20 min-h-screen flex items-center justify-center px-4">
                <section className="login-card" role="dialog" aria-labelledby="login-title">
                    <header className="login-header">
                        <h1 id="login-title" className="login-title">로그인</h1>
                        <p className="login-subtitle">SETA 플랫폼에 오신 것을 환영합니다</p>
                    </header>

                    <form className="login-form">
                        <div className="field">
                            <label htmlFor="username" className="label">아이디</label>
                            <input
                                id="username"
                                type="text"
                                placeholder="아이디를 입력하세요"
                                className="input"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="password" className="label">비밀번호</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="input"
                            />
                        </div>

                        <button type="submit" className="btn">로그인</button>

                        <div className="signup">
                            <span className="signup-text">계정이 없으신가요?</span>
                            <button type="button" className="signup-link">
                                회원가입
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
