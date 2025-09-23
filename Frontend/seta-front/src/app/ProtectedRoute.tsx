import { Navigate, Outlet, useLocation } from "react-router-dom";
import { tokenStore, isJwtExpired } from "@/shared/auth/token";

export default function ProtectedRoute() {
    const loc = useLocation();
    const at = tokenStore.getAccess();

    if (!at || isJwtExpired(at)) {
        const next = encodeURIComponent(loc.pathname + loc.search);
        return <Navigate to={`/login?next=${next}`} replace />;
    }
    return <Outlet />;
}
