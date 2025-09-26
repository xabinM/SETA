import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {setUnauthorizedHandler} from "@/shared/api/http";
import {tokenStore, isJwtExpired} from "@/shared/auth/token";

const PUBLIC_PATHS = new Set<string>(["/", "/home", "/login", "/signup"]);
const isPublicPath = (path: string) => PUBLIC_PATHS.has(path);

export default function AppBootstrap() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setUnauthorizedHandler(() => {
            tokenStore.clear();
            const path = window.location.pathname; // 그 순간의 실제 경로
            const search = window.location.search;
            const next = encodeURIComponent(path + search);

            if (isPublicPath(path)) {
                navigate("/login", {replace: true});
            } else {
                navigate(`/login?next=${next}`, {replace: true});
            }
        });
        return () => setUnauthorizedHandler(null);
    }, [navigate]);

    useEffect(() => {
        const at = tokenStore.getAccess();
        if (!at) return;

        if (isJwtExpired(at)) {
            tokenStore.clear();

            const path = location.pathname;
            const search = location.search;

            if (isPublicPath(path)) {
                return;
            }

            const next = encodeURIComponent(path + search);
            navigate(`/login?next=${next}`, {replace: true});
        }
    }, [navigate, location.pathname, location.search]);

    return null;
}
