import {useState} from "react";
import LoginBg from "@/assets/loginBackground.png";
import "./Login.css";
import {useNavigate, useSearchParams} from "react-router-dom";
import {login} from "@/features/auth/api";
import {ApiError} from "@/shared/api/http";
import CustomToast from "@/ui/components/Toast/CustomToast";
import {tokenStore} from "@/shared/auth/token";

export default function Login() {
    const navigate = useNavigate();
    const [sp] = useSearchParams();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; desc?: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username.trim() || !password) {
            setToast({msg: "입력값을 확인해주세요.", desc: "아이디/비밀번호는 필수입니다."});
            return;
        }

        try {
            setLoading(true);
            const res = await login({username: username.trim(), password});
            const access = res?.tokens?.accessToken ?? null;
            const refresh = res?.tokens?.refreshToken ?? null;
            tokenStore.set({access, refresh});

            setToast({msg: "로그인 성공!", desc: "환영합니다 🎉"});
            const rawNext = sp.get("next");
            const next = rawNext && rawNext.startsWith("/") ? rawNext : "/chat";
            setTimeout(() => navigate(next, {replace: true}), 500);
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? `${err.status} ${err.message}`
                    : err instanceof Error
                        ? err.message
                        : "알 수 없는 오류";
            setToast({msg: "로그인 실패", desc: msg});
        } finally {
            setLoading(false);
        }
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
            <div className="absolute inset-0 bg-black/40 z-10"/>

            <main className="relative z-20 min-h-screen flex items-center justify-center px-4">
                <section className="login-card" role="dialog" aria-labelledby="login-title">
                    <header className="login-header">
                        <h1 id="login-title" className="login-title">로그인</h1>
                        <p className="login-subtitle">SETA 플랫폼에 오신 것을 환영합니다</p>
                    </header>

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <div className="field">
                            <label htmlFor="username" className="label">아이디</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="아이디를 입력하세요"
                                className="input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="password" className="label">비밀번호</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            disabled={loading}
                            aria-busy={loading}
                        >
                            {loading ? "로그인 중…" : "로그인"}
                        </button>

                        <div className="signup">
                            <span className="signup-text">계정이 없으신가요?</span>
                            <button
                                type="button"
                                className="signup-link"
                                onClick={() => navigate("/signup")}
                            >
                                회원가입
                            </button>
                        </div>
                    </form>
                </section>
            </main>

            {toast && (
                <CustomToast
                    message={toast.msg}
                    description={toast.desc}
                    duration={500}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
