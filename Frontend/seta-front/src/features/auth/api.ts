import {http} from "@/shared/api/http";

export type SignUpPayload = {
    username: string;
    password: string;
    name: string;
};

// 백엔드 응답 스키마에 맞춰서 필요 시 수정
export type SignUpResponse = {
    id?: string;
    message?: string;
};

export function signUp(payload: SignUpPayload, signal?: AbortSignal) {
    return http<SignUpResponse>("/api/auth/signup", {
        method: "POST",
        body: payload,
        signal,
        auth: false,
    });
}

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

export function login(payload: LoginPayload, signal?: AbortSignal) {
    return http<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: payload,
        signal,
        auth: false,
    });
}