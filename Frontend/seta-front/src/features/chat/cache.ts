import type {ChatRoom} from "./api";

const CHAT_ROOMS_KEY = "cache:chatRooms";

export function loadCachedRooms(): ChatRoom[] {
    try {
        return JSON.parse(localStorage.getItem(CHAT_ROOMS_KEY) || "[]");
    } catch {
        return [];
    }
}

export function saveCachedRooms(rooms: ChatRoom[]) {
    try {
        localStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(rooms));
    } catch {
        // 용량 초과 등 무시
    }
}

export function clearCachedRooms() {
    localStorage.removeItem(CHAT_ROOMS_KEY);
}
