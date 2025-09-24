import { http } from "@/shared/api/http";

export type ChatRoom = {
  chatRoomId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export async function getChatRooms(): Promise<ChatRoom[]> {
    return http<ChatRoom[]>("/chat/rooms", { method: "GET", auth: true,});
}

export async function createChatRoom(): Promise<ChatRoom> {
    return http<ChatRoom>("/chat/rooms", { method: "POST", auth: true });
}

export async function deleteChatRoom(roomId: string): Promise<void> {
    return http<void>(`/chat/rooms/${roomId}`, { method: "DELETE", auth: true });
}
