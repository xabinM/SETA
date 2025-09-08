import React, { useState } from "react";
import LoginBg from "@/assets/loginBackground.png"
import "./Login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login attempt:", { email, password });
    };

    const handleSignupClick = () => {
        console.log("Navigate to signup");
    };

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

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="email" className="label">이메일 주소</label>
                            <input
                                id="email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="password" className="label">비밀번호</label>
                            <input
                                id="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                            />
                        </div>

                        <button type="submit" className="btn">로그인</button>

                        <div className="signup">
                            <span className="signup-text">계정이 없으신가요?</span>
                            <button type="button" className="signup-link" onClick={handleSignupClick}>
                                회원가입
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
