// src/ui/components/Modal/CarModal/data.ts
import type {CarModalData} from "./types";

// 전력 효율성 기준 (실제 전기차 평균)
const EFFICIENCY_KM_PER_KWH = 5.2; // 현대 아이오닉 5 기준

// 절약된 토큰으로 계산되는 전력량 (kWh)
function calculatePowerFromTokens(savedTokens: number): number {
    // 1000 토큰당 약 1kWh 절약 가정
    return savedTokens / 1000;
}

// 절약된 전력으로 갈 수 있는 거리별 목적지 결정
function getTripByDistance(powerKwh: number): { origin: string; destination: string; totalKm: number; segments: Array<{ title: string; km: number }> } {
    const maxKm = Math.round(powerKwh * EFFICIENCY_KM_PER_KWH);
    
    if (maxKm < 150) {
        return {
            origin: "서울",
            destination: "대전", 
            totalKm: 140,
            segments: [
                {title: "서울 → 수원", km: 30},
                {title: "수원 → 천안", km: 50},
                {title: "천안 → 대전", km: 60},
            ]
        };
    }
    
    if (maxKm < 320) {
        return {
            origin: "서울",
            destination: "대구",
            totalKm: 290,
            segments: [
                {title: "서울 → 대전", km: 140},
                {title: "대전 → 김천", km: 80},
                {title: "김천 → 대구", km: 70},
            ]
        };
    }
    
    if (maxKm < 500) {
        return {
            origin: "서울",
            destination: "부산",
            totalKm: 325,
            segments: [
                {title: "서울 → 대전", km: 140},
                {title: "대전 → 대구", km: 130},
                {title: "대구 → 부산", km: 55},
            ]
        };
    }
    
    if (maxKm < 1000) {
        return {
            origin: "서울",
            destination: "제주",
            totalKm: 470,
            segments: [
                {title: "서울 → 목포", km: 280},
                {title: "목포 → 제주항 (페리)", km: 100},
                {title: "제주항 → 제주시", km: 90},
            ]
        };
    }
    
    if (maxKm < 1200) {
        return {
            origin: "서울",
            destination: "상하이",
            totalKm: 950,
            segments: [
                {title: "서울 → 인천항", km: 50},
                {title: "인천 → 상하이항 (페리)", km: 800},
                {title: "상하이항 → 상하이시", km: 100},
            ]
        };
    }
    
    return {
        origin: "서울",
        destination: "도쿄",
        totalKm: 1160,
        segments: [
            {title: "서울 → 부산", km: 325},
            {title: "부산 → 후쿠오카 (페리)", km: 235},
            {title: "후쿠오카 → 도쿄", km: 600},
        ]
    };
}

// API 데이터 기반으로 CarModal 데이터 생성
export function createCarModalData(savedTokens: number, scope: "me" | "all"): CarModalData {
    const powerKwh = calculatePowerFromTokens(savedTokens);
    const trip = getTripByDistance(powerKwh);
    
    return {
        power: { 
            current: powerKwh, 
            goal: Math.ceil(trip.totalKm / EFFICIENCY_KM_PER_KWH), 
            step: scope === "me" ? 5 : 20 
        },
        trip,
        vehicle: { efficiencyKmPerKwh: EFFICIENCY_KM_PER_KWH },
        segments: trip.segments,
        cta: { share: true },
    };
}

// 기본 더미 데이터 (API 연동 전 사용)
export const mockCarModalData: CarModalData = {
    power: {current: 10, goal: 200, step: 20},
    trip: {origin: "서울", destination: "부산", totalKm: 325},
    vehicle: {efficiencyKmPerKwh: EFFICIENCY_KM_PER_KWH},
    segments: [
        {title: "서울 → 대전", km: 140},
        {title: "대전 → 대구", km: 130},
        {title: "대구 → 부산", km: 55},
    ],
    cta: {share: true},
};

// 범위별 더미 데이터 (하위 호환성)
export const carModalDataByScope: Record<"me" | "all", CarModalData> = {
    me: {
        power: {current: 5, goal: 100, step: 10},
        trip: {origin: "서울", destination: "대전", totalKm: 140},
        vehicle: {efficiencyKmPerKwh: EFFICIENCY_KM_PER_KWH},
        segments: [
            {title: "서울 → 수원", km: 30},
            {title: "수원 → 천안", km: 50},
            {title: "천안 → 대전", km: 60},
        ],
        cta: {share: true},
    },
    all: {
        power: {current: 65, goal: 400, step: 50},
        trip: {origin: "서울", destination: "도쿄", totalKm: 1160},
        vehicle: {efficiencyKmPerKwh: EFFICIENCY_KM_PER_KWH},
        segments: [
            {title: "서울 → 부산", km: 325},
            {title: "부산 → 후쿠오카 (페리)", km: 235},
            {title: "후쿠오카 → 도쿄", km: 600},
        ],
        cta: {share: true},
    },
};