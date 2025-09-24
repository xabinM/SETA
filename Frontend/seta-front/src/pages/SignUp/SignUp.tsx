import {useState} from "react";
import SignUpBg from "@/assets/loginBackground.png";
import CustomToast from "@/ui/components/Toast/CustomToast";
import "./SignUp.css";
import {useNavigate} from "react-router-dom";
import {signUp} from "@/features/auth/api";
import {ApiError} from "@/shared/api/http";

export default function SignUp() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [matchStatus, setMatchStatus] = useState<"match" | "mismatch" | "">("");
    const [toast, setToast] = useState<{ msg: string; desc?: string } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const checkMatch = (pass: string, confirm: string) => {
        if (!pass || !confirm) return setMatchStatus("");
        setMatchStatus(pass === confirm ? "match" : "mismatch");
    };

    const handlePasswordChange = (v: string) => {
        setPassword(v);
        checkMatch(v, confirmPassword);
    };
    const handleConfirmChange = (v: string) => {
        setConfirmPassword(v);
        checkMatch(password, v);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (matchStatus !== "match") {
            setToast(null);
            setTimeout(() => {
                setToast({msg: "비밀번호가 일치하지 않습니다.", desc: "다시 확인해주세요."});
            }, 0);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const payload = {
            username: String(formData.get("username") ?? "").trim(),
            password: String(formData.get("password") ?? ""),
            name: String(formData.get("name") ?? "").trim(),
        };

        if (!payload.username || !payload.password || !payload.name) {
            setToast(null);
            setTimeout(() => {
                setToast({msg: "입력값을 확인해주세요.", desc: "이름/아이디/비밀번호는 필수입니다."});
            }, 0);
            return;
        }

        try {
            setLoading(true);
            await signUp(payload);
            setToast(null);
            setTimeout(() => {
                setToast({msg: "회원가입 요청 전송!", desc: "환영합니다. SETA의 새로운 모험가님 🚀"});
            }, 0);

            setTimeout(() => navigate("/login"), 500);
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? `${err.status} ${err.message}`
                    : err instanceof Error
                        ? err.message
                        : "알 수 없는 오류";
            setToast(null);
            setTimeout(() => {
                setToast({msg: "회원가입 실패", desc: msg});
            }, 0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="signup-page relative min-h-screen overflow-hidden"
            style={{
                backgroundImage: `url(${SignUpBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="absolute inset-0 bg-black/40 z-10"/>

            <main className="relative z-20 min-h-screen flex items-center justify-center px-4">
                <section className="signup-card" role="dialog" aria-labelledby="signup-title">
                    <header className="signup-header">
                        <h1 id="signup-title" className="signup-title">회원가입</h1>
                        <p className="signup-subtitle">SETA 플랫폼의 새 계정을 만들어보세요</p>
                    </header>

                    <form className="signup-form" onSubmit={handleSubmit} noValidate>
                        <div className="field">
                            <label htmlFor="name" className="label">이름</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="이름을 입력하세요"
                                className="input"
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="username" className="label">아이디</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="아이디를 입력하세요"
                                className="input"
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="password" className="label">비밀번호</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                className="input"
                                value={password}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                required
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="confirmPassword" className="label">비밀번호 확인</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="비밀번호를 다시 입력하세요"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => handleConfirmChange(e.target.value)}
                                required
                                aria-invalid={matchStatus === "mismatch"}
                                aria-describedby="pw-match-hint"
                            />
                            {matchStatus === "match" && (
                                <p id="pw-match-hint" className="success-text">비밀번호가 일치합니다.</p>
                            )}
                            {matchStatus === "mismatch" && (
                                <p id="pw-match-hint" className="error-text">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>

                        <button type="submit"
                                className="btn"
                                disabled={loading}
                                aria-busy={loading}
                        >
                            {loading ? "회원가입 중…" : "회원가입"}
                        </button>

                        <div className="login-redirect">
                            <span className="login-text">이미 계정이 있으신가요?</span>
                            <button type="button" className="login-link" onClick={() => navigate("/login")}>로그인</button>
                        </div>
                    </form>
                </section>
            </main>

            {toast && (
                <CustomToast
                    message={toast.msg}
                    description={toast.desc}
                    duration={2500}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
