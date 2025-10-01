import {http} from "@/shared/api/http";

export type UserSettingServer = {
    userId: string;
    callMe: string | null;
    roleDescription: string | null;
    preferredTone: string | null;
    traits: string | null;
    additionalContext: string | null;
    updatedAt: string | null;
};

export async function getMyUserSetting(): Promise<UserSettingServer | null> {
    try {
        const res = await http("/user-settings/me", {method: "GET"});
        return res as UserSettingServer;
    } catch (e: unknown) {
        if (e && typeof e === "object" && "status" in e) {
            const err = e as { status?: number };
            if (err.status === 404 || err.status === 204) return null;
        }
        throw e;
    }
}

export type UserSettingCreatePayload = {
    callMe: string;
    roleDescription: string;
    preferredTone: string;
    traits: string;
    additionalContext: string;
};

export async function createMyUserSetting(payload: UserSettingCreatePayload) {
    return http("/user-settings/me", {method: "POST", body: payload});
}


export type UserSettingPatchPayload = Partial<UserSettingCreatePayload>;

export async function patchMyUserSetting(payload: UserSettingPatchPayload) {
    return http("/user-settings/me", {method: "PATCH", body: payload});
}
