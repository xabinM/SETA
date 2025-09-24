// src/ui/components/Modal/CarModal/data.ts
import type {CarModalData} from "./types";

// 여기 "입력값"만 바꾸면 CarModal이 내부에서 전부 자동 계산됨
export const mockCarModalData: CarModalData = {
    power: {current: 10, goal: 200, step: 20}, // ← current 바꾸면 KPI/진행률/등가 km/구간 상태 자동 반영
    trip: {origin: "서울", destination: "부산", totalKm: 400},
    vehicle: {efficiencyKmPerKwh: 6}, // 1kWh로 6km
    segments: [
        {title: "서울 → 대전", km: 140},
        {title: "대전 → 대구", km: 130},
        {title: "대구 → 부산", km: 130},
    ],
    // kpis 생략 가능(컴포넌트에서 power.current로 자동 생성)
    cta: {share: true},
};

// 범위별 더미도 제공 (대시보드 scope 연동 시 사용)
export const carModalDataByScope: Record<"me" | "all", CarModalData> = {
    me: mockCarModalData,
    all: {
        power: {current: 65, goal: 800, step: 50},
        trip: {origin: "서울", destination: "제주", totalKm: 470},
        vehicle: {efficiencyKmPerKwh: 5.5},
        segments: [
            {title: "서울 → 대전", km: 140},
            {title: "대전 → 광주", km: 190},
            {title: "광주 → 목포(항)", km: 140},
        ],
        cta: {share: true},
    },
};
