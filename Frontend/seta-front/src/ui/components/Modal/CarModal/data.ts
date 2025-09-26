// src/ui/components/Modal/CarModal/data.ts
import type {CarModalData} from "./types";

// 전력 효율성 기준 (실제 전기차 평균)
const EFFICIENCY_KM_PER_KWH = 5.2; // 현대 아이오닉 5 기준

// 절약된 토큰으로 계산되는 전력량 (kWh)
function calculatePowerFromTokens(savedTokens: number): number {
    // 1000 토큰당 약 1kWh 절약 가정 (AI 모델 처리 전력 효율성 기반)
    return Math.max(0, savedTokens) / 1000;
}

// 절약된 전력으로 갈 수 있는 거리별 목적지 결정
function getTripByDistance(powerKwh: number): { origin: string; destination: string; totalKm: number; segments: Array<{ title: string; km: number }> } {
    const maxKm = Math.round(powerKwh * EFFICIENCY_KM_PER_KWH);
    
    if (maxKm < 50) {
        return {
            origin: "강남",
            destination: "인천공항", 
            totalKm: 45,
            segments: [
                {title: "강남 → 여의도", km: 15},
                {title: "여의도 → 김포공항", km: 15},
                {title: "김포공항 → 인천공항", km: 15},
            ]
        };
    }
    
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

// 사용자 토큰 데이터 기반으로 동적 KPI 생성
function generateKPIs(savedTokens: number, powerKwh: number): Array<{ icon: string; label: string; value: string; hint?: string }> {
    const costSaving = Math.round(powerKwh * 110); // 110원/kWh
    const co2Reduction = Math.round(powerKwh * 0.2); // 0.2kg CO2/kWh
    const treesEquivalent = Math.max(1, Math.round(co2Reduction / 22)); // 나무 1그루당 연간 22kg CO2 흡수
    
    return [
        {
            icon: "🔋", 
            label: "누적 전력 절약", 
            value: `${powerKwh.toFixed(1)} kWh`,
            hint: `${savedTokens.toLocaleString()}토큰 최적화`
        },
        {
            icon: "🌿", 
            label: "CO₂ 절감", 
            value: `${co2Reduction.toLocaleString()} kg`,
            hint: `나무 ${treesEquivalent}그루 흡수량과 동일`
        },
        {
            icon: "💰", 
            label: "비용 절감", 
            value: `${costSaving.toLocaleString()} 원`,
            hint: "전기요금 기준"
        },
        {
            icon: "⚙️", 
            label: "전비", 
            value: `${EFFICIENCY_KM_PER_KWH} km/kWh`,
            hint: "아이오닉 5 기준"
        },
    ];
}

// API 데이터 기반으로 CarModal 데이터 생성
export function createCarModalData(savedTokens: number, scope: "me" | "all"): CarModalData {
    // null 안전성 처리
    const safeTokens = Math.max(0, savedTokens || 0);
    const powerKwh = calculatePowerFromTokens(safeTokens);
    const trip = getTripByDistance(powerKwh);
    const kpis = generateKPIs(safeTokens, powerKwh);
    
    // 목표 계산: 목적지까지 가는데 필요한 전력량
    const goalPowerKwh = Math.max(1, Math.ceil(trip.totalKm / EFFICIENCY_KM_PER_KWH));
    
    return {
        power: { 
            current: powerKwh, 
            goal: goalPowerKwh, 
            step: scope === "me" ? 1 : 5  // 개인은 1kWh씩, 전체는 5kWh씩
        },
        trip,
        vehicle: { efficiencyKmPerKwh: EFFICIENCY_KM_PER_KWH },
        segments: trip.segments,
        kpis,
        cta: { share: true },
    };
}

// 범위별 데이터 (실제 토큰 값 기반으로 생성)
export function getCarModalDataByScope(meTokens: number = 0, allTokens: number = 0) {
    return {
        me: createCarModalData(meTokens, "me"),
        all: createCarModalData(allTokens, "all"),
    };
}

// 기본 더미 데이터 (API 연동 전 테스트용)
export const mockCarModalData: CarModalData = createCarModalData(1047, "me");

// 하위 호환성을 위한 정적 데이터 (deprecated)
export const carModalDataByScope: Record<"me" | "all", CarModalData> = {
    me: createCarModalData(1047, "me"),      // 예시: 개인 1047토큰
    all: createCarModalData(13442, "all"),   // 예시: 전체 13442토큰
};