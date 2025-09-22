import { http } from "@/shared/api/http";

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
  });
}