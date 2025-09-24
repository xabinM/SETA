import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {setUnauthorizedHandler} from "@/shared/api/http";
import {tokenStore, isJwtExpired} from "@/shared/auth/token";

const PUBLIC_PATHS = new Set<string>(["/", "/home", "/login", "/signup"]);
const isPublicPath = (path: string) => PUBLIC_PATHS.has(path);

export default function AppBootstrap() {
    const navigate = useNavigate();
    const location = useLocation();

    // 401 전역 처리: 한 번만 등록
    useEffect(() => {
        setUnauthorizedHandler(() => {
            tokenStore.clear();
            const path = window.location.pathname; // 그 순간의 실제 경로
            const search = window.location.search;
            const next = encodeURIComponent(path + search);

            // 공개 경로면 next 없이 로그인으로만
            if (isPublicPath(path)) {
                navigate("/login", {replace: true});
            } else {
                navigate(`/login?next=${next}`, {replace: true});
            }
        });
        return () => setUnauthorizedHandler(null);
    }, [navigate]);

    // 초기 진입 시 만료 토큰이면 정리 + (보호 경로일 때만) 로그인으로
    useEffect(() => {
        const at = tokenStore.getAccess();
        if (!at) return;                 // 토큰 없으면 아무 것도 하지 않음(공개 페이지 허용)

        if (isJwtExpired(at)) {
            tokenStore.clear();

            const path = location.pathname;
            const search = location.search;

            if (isPublicPath(path)) {
                // 공개 경로면 그대로 두거나 필요시 /login 으로만
                // navigate("/login", { replace: true });
                return;
            }

            const next = encodeURIComponent(path + search);
            navigate(`/login?next=${next}`, {replace: true});
        }
    }, [navigate, location.pathname, location.search]);

    return null;
}
