import {tokenStore, isJwtExpired} from "@/shared/auth/token";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const BASE = RAW_BASE.replace(/\/+$/, "");

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpOptions = {
    method?: HttpMethod;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    signal?: AbortSignal;
    withCredentials?: boolean;
    auth?: boolean;
};

export class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

export type UnauthorizedHandler = () => void;
let _onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
    _onUnauthorized = fn;
}

function isAbsoluteUrl(str: string) {
    return /^https?:\/\//i.test(str);
}

function buildUrl(path: string, query?: HttpOptions["query"]) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const base = BASE || "";
    const url = isAbsoluteUrl(base)
        ? new URL(base + cleanPath)
        : new URL(base + cleanPath, window.location.origin);

    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined || v === null) continue;
            url.searchParams.set(k, String(v));
        }
    }
    return url.toString();
}

function hasMessage(x: unknown): x is { message: unknown } {
    return typeof x === "object" && x !== null && "message" in (x as Record<string, unknown>);
}

export async function http<T = unknown>(path: string, opts: HttpOptions = {}): Promise<T> {
    const url = buildUrl(path, opts.query);
    const headers: Record<string, string> = {...(opts.headers ?? {})};

    const useAuth = opts.auth !== false;
    if (useAuth && !headers["Authorization"]) {
        const at = tokenStore.getAccess();
        if (typeof at === "string" && at.length > 0 && !isJwtExpired(at)) {
            headers["Authorization"] = `Bearer ${at}`;
        }
    }

    let body: BodyInit | undefined;
    if (opts.body !== undefined) {
        const b = opts.body as unknown;
        if (
            b instanceof FormData ||
            typeof b === "string" ||
            b instanceof Blob ||
            b instanceof URLSearchParams ||
            b instanceof ArrayBuffer ||
            ArrayBuffer.isView(b)
        ) {
            body = b as BodyInit;
        } else {
            body = JSON.stringify(opts.body);
            if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
        }
    }

    const init: RequestInit = {
        method: opts.method ?? "GET",
        headers,
        body,
        signal: opts.signal,
        credentials: opts.withCredentials ? "include" : "same-origin",
    };

    const res = await fetch(url, init);

    const text = await res.text();
    let data: unknown;
    try {
        data = text ? JSON.parse(text) : undefined;
    } catch {
        data = text;
    }

    if (!res.ok) {
        const msg =
            (hasMessage(data) && typeof (data as { message: unknown }).message === "string"
                ? (data as { message: string }).message
                : undefined) ||
            (typeof data === "string" && data.trim() ? data : undefined) ||
            `HTTP ${res.status}`;

        if (res.status === 401) {
            _onUnauthorized?.();
        }

        throw new ApiError(msg, res.status, data);
    }

    return data as T;
}
