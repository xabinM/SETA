import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setUnauthorizedHandler } from "@/shared/api/http";
import { tokenStore, isJwtExpired } from "@/shared/auth/token";

export default function AppBootstrap() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setUnauthorizedHandler(() => {
            tokenStore.clear();
            const next = encodeURIComponent(location.pathname + location.search);
            navigate(`/login?next=${next}`, { replace: true });
        });

        const at = tokenStore.getAccess();
        if (at && isJwtExpired(at)) {
            tokenStore.clear();
            const next = encodeURIComponent(location.pathname + location.search);
            navigate(`/login?next=${next}`, { replace: true });
        }

        return () => setUnauthorizedHandler(null);
    }, [navigate, location]);

    return null;
}
