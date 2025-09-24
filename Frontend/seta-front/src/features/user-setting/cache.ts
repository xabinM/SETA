import { getMyUserSetting, type UserSettingServer } from "./api";

let cache: UserSettingServer | null | undefined;

export async function prefetchMyUserSetting() {
    if (cache !== undefined) return cache;
    cache = await getMyUserSetting();
    return cache;
}

export function getCachedMyUserSetting() {
    return cache;
}

export function setCachedMyUserSetting(v: UserSettingServer | null) {
    cache = v;
}
