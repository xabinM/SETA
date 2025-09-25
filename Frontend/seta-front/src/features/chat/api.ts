import {http} from "@/shared/api/http";

export type ChatRoom = {
    chatRoomId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
};

export async function getChatRooms(): Promise<ChatRoom[]> {
    return http<ChatRoom[]>("/chat/rooms", {method: "GET", auth: true,});
}

export async function createChatRoom(): Promise<ChatRoom> {
    return http<ChatRoom>("/chat/rooms", {method: "POST", auth: true});
}

export async function deleteChatRoom(roomId: string): Promise<void> {
    return http<void>(`/chat/rooms/${roomId}`, {method: "DELETE", auth: true});
}


export type ChatMessage = {
    messageId: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    turnIndex?: number;
};

export type UIMsg = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    turnIndex?: number;
};

export type SendMessageResponse = {
    traceId: string
};

export async function getRoomMessages(roomId: string): Promise<UIMsg[]> {
    const raw = await http<ChatMessage[]>(
        `/chat/rooms/${roomId}/messages`,
        {method: "GET", auth: true}
    );

    const sorted = [...raw].sort((a, b) => {
        const t = Date.parse(a.createdAt) - Date.parse(b.createdAt);
        return t !== 0 ? t : (a.turnIndex ?? 0) - (b.turnIndex ?? 0);
    });

    return sorted.map(m => ({
        id: m.messageId,
        role: (m.role || "user").toLowerCase() === "assistant" ? "assistant" : "user",
        content: m.content ?? "",
        createdAt: m.createdAt,
        turnIndex: m.turnIndex,
    }));
}

export async function sendMessageToServer(roomId: string, text: string) {
    return http<SendMessageResponse>(`/chat/rooms/${roomId}/messages`, {
        method: "POST",
        body: { text },
        auth: true,
    });
}