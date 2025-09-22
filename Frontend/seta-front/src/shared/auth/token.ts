const ACCESS_KEY = "se:at";
const REFRESH_KEY = "se:rt";

type JwtPayload = { exp?: number } & Record<string, unknown>;

function b64urlDecode(input: string) {
    let s = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4;
    if (pad) s += "=".repeat(4 - pad);
    try {
        return atob(s);
    } catch {
        return "";
    }
}

function parseJwt(token: string): JwtPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const json = b64urlDecode(parts[1]);
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

function msUntilExpiry(token?: string | null): number | null {
    if (!token) return null;
    const payload = parseJwt(token);
    if (!payload || typeof payload.exp !== "number") return null;
    return payload.exp * 1000 - Date.now();
}

export const tokenStore = {
    set(tokens: { access?: string | null; refresh?: string | null }) {
        if ("access" in tokens) {
            const access = tokens.access ?? null;
            if (access) localStorage.setItem(ACCESS_KEY, access);
            else localStorage.removeItem(ACCESS_KEY);
        }
        if ("refresh" in tokens) {
            const refresh = tokens.refresh ?? null;
            if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
            else localStorage.removeItem(REFRESH_KEY);
        }
    },
    getAccess() {
        return localStorage.getItem(ACCESS_KEY);
    },
    getRefresh() {
        return localStorage.getItem(REFRESH_KEY);
    },
    clear() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },
    isExpired(token?: string | null) {
        const ms = msUntilExpiry(token ?? undefined);
        return ms !== null ? ms <= 0 : false;
    },
};

export function isJwtExpired(token?: string | null): boolean {
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length < 2) return false;
    try {
        let s = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const pad = s.length % 4;
        if (pad) s += "=".repeat(4 - pad);
        const json = atob(s);
        const payload = JSON.parse(json) as { exp?: number };
        if (typeof payload.exp !== "number") return false;
        return payload.exp * 1000 <= Date.now();
    } catch {
        return false;
    }
}
