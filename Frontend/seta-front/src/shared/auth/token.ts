const ACCESS_KEY = "se:at";
const REFRESH_KEY = "se:rt";

export const tokenStore = {
    set(tokens: { access?: string | null; refresh?: string | null }) {
        const { access, refresh } = tokens;
        if (access !== undefined) {
            if (access) localStorage.setItem(ACCESS_KEY, access);
            else localStorage.removeItem(ACCESS_KEY);
        }
        if (refresh !== undefined) {
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
};
