import { http } from "@/shared/api/http";

export type ChatRoom = {
  chatRoomId: string;
  title: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export async function getChatRooms(): Promise<ChatRoom[]> {
  return http<ChatRoom[]>("/chat/rooms", {
    method: "GET",
    auth: true,
  });
}