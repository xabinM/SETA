const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const BASE = RAW_BASE.replace(/\/+$/, ""); // 우측 슬래시 정리

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  /** URL 쿼리 파라미터 ?a=1&b=2 */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON 바디 또는 FormData/Blob/URLSearchParams 등 */
  body?: unknown;
  signal?: AbortSignal;
  /** 쿠키 기반 인증 시 true → credentials: "include" */
  withCredentials?: boolean;
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

function isAbsoluteUrl(str: string) {
  return /^https?:\/\//i.test(str);
}

function buildUrl(path: string, query?: HttpOptions["query"]) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = BASE || "";

  // 절대(BASE가 http/https)와 상대(BASE가 /api 같은 경로) 모두 지원
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

  // 헤더 구성
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };

  // 바디 구성 (any 제거)
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
      body = b as BodyInit; // 그대로 전송
    } else {
      body = JSON.stringify(opts.body); // 객체 → JSON
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

  // 본문 안전 파싱 (비어있을 수도 있음)
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text; // JSON이 아니면 원문 문자열
  }

  if (!res.ok) {
    const msg =
        (hasMessage(data) && typeof (data as { message: unknown }).message === "string"
            ? (data as { message: string }).message
            : undefined) ||
        (typeof data === "string" && data.trim() ? data : undefined) ||
        `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  // 204 No Content 등
  return data as T;
}