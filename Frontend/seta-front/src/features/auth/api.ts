import {http} from "@/shared/api/http";
import {tokenStore} from "@/shared/auth/token.ts";

export type SignUpPayload = {
    username: string;
    password: string;
    name: string;
};

export type SignUpResponse = {
    id?: string;
    message?: string;
};

export type LoginPayload = {
    username: string;
    password: string;
};

export type LoginResponse = {
    message: string;
    userId: number;
    name: string;
    success: boolean;
    tokens?: {
        accessToken?: string;
        refreshToken?: string;
    };
};

export type Me = {
    username: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const BASE = RAW_BASE.replace(/\/+$/, "");

export function signUp(payload: SignUpPayload, signal?: AbortSignal) {
    return http<SignUpResponse>("/auth/signup", {
        method: "POST",
        body: payload,
        signal,
        auth: false,
    });
}

export function login(payload: LoginPayload, signal?: AbortSignal) {
    return http<LoginResponse>("/auth/login", {
        method: "POST",
        body: payload,
        signal,
        auth: false,
    });
}

export async function logout(signal?: AbortSignal) {
    const refresh = tokenStore.getRefresh();
    try {
        await clearStreamCookie(signal);
    } catch (err) {
        console.error(err);
    }
    if (!refresh) return;

    await http<void>("/auth/logout", {
        method: "POST",
        headers: {RefreshToken: refresh},
        auth: false,
        signal,
    });
}

export function getMe(signal?: AbortSignal) {
    return http<Me>("/auth/me", {
        method: "GET",
        signal,
        auth: true,
    });
}

export async function issueStreamCookie(signal?: AbortSignal) {
    const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
    const BASE = RAW_BASE.replace(/\/+$/, "");
    const access = tokenStore.getAccess?.() ?? null;
    if (!access) throw new Error("No access token. Please login first.");

    const url = `${BASE}/auth/stream-cookie?token=${encodeURIComponent(access)}`;
    const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {Authorization: `Bearer ${access}`},
        signal,
    });

    if (!res.ok) {
        throw new Error(`stream-cookie failed: ${res.status}`);
    }
}


export async function clearStreamCookie(signal?: AbortSignal) {
    const res = await fetch(`${BASE}/auth/stream-cookie`, {
        method: "DELETE",
        credentials: "include",
        signal,
    });
    if (!res.ok) {
        throw new Error(`clear stream-cookie failed: ${res.status}`);
    }
}
