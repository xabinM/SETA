import {http} from "@/shared/api/http";

export type UserStats = {
    userId: string;
    statDate: string;
    requestCount: number;
    savedTokens: number;
    tokenSum: number;
    costSumUsd: number;
};

export type DailyStats = {
    windowStartKst: string;
    requestCount: number;
    savedTokens: number;
    tokenSum: number;
    costSumUsd: number;
};

export type UserDailyStats = DailyStats & {
    userId: string;
};

export type GlobalStats = {
    statDate: string;
    requestCount: number;
    savedTokens: number;
    tokenSum: number;
    costSumUsd: number | null;
};

export type DroppedText = {
    droppedText: string;
    count: number;
};

export type ReasonType = {
    reasonType: string;
    count: number;
};

export type DashboardKpiResponse = {
    userTotal: UserStats;
    userDaily: UserDailyStats;
    globalDaily: DailyStats;
    globalTotal: GlobalStats;
    topDroppedTexts: DroppedText[];
    topReasons: ReasonType[];
};

export async function getDashboardKpi(signal?: AbortSignal): Promise<DashboardKpiResponse> {
    return http<DashboardKpiResponse>("/dashboard/kpi", {
        method: "GET",
        auth: true,
        signal,
    });
}