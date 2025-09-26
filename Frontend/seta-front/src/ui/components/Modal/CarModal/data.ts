// src/ui/components/Modal/CarModal/data.ts
import type {CarModalData} from "./types";

// 동적 전비 계산 함수
function calculateEfficiency(totalDistance: number, totalPowerUsed: number): number {
    if (totalPowerUsed === 0) return 5.2; // 기본값
    return totalDistance / totalPowerUsed; // km/kWh
}

// 절약된 토큰으로 계산되는 전력량 (kWh)
function calculatePowerFromTokens(savedTokens: number): number {
    // 1000 토큰당 약 1kWh 절약 가정 (AI 모델 처리 전력 효율성 기반)
    return Math.max(0, savedTokens) / 1000;
}

// 절약된 전력으로 갈 수 있는 거리별 목적지 결정 (수정됨)
function getTripByDistance(powerKwh: number, baseEfficiency: number = 5.2): { 
    origin: string; 
    destination: string; 
    totalKm: number; 
    segments: Array<{ title: string; km: number }>;
    actualEfficiency: number;
} {
    // 현실적인 전비 범위로 제한 (3.0 - 7.0 km/kWh)
    const efficiency = Math.max(3.0, Math.min(7.0, baseEfficiency));
    const maxKm = Math.round(powerKwh * efficiency);
    
    console.log('전력량:', powerKwh, 'kWh, 기준전비:', baseEfficiency, 'km/kWh, 제한전비:', efficiency, 'km/kWh, 최대거리:', maxKm, 'km');
    
    // 실제 사용될 여행 데이터
    let actualTrip;
    
    // 토큰이 0이거나 매우 적을 때 (0-50km)
    if (maxKm < 50) {
        actualTrip = {
            origin: "강남",
            destination: "인천공항", 
            totalKm: 45,
            segments: [
                {title: "강남 → 여의도", km: 15},
                {title: "여의도 → 김포공항", km: 15},
                {title: "김포공항 → 인천공항", km: 15},
            ]
        };
    } else if (maxKm < 150) {
        actualTrip = {
            origin: "서울",
            destination: "대전", 
            totalKm: 140,
            segments: [
                {title: "서울 → 수원", km: 30},
                {title: "수원 → 천안", km: 50},
                {title: "천안 → 대전", km: 60},
            ]
        };
    } else if (maxKm < 320) {
        actualTrip = {
            origin: "서울",
            destination: "대구",
            totalKm: 290,
            segments: [
                {title: "서울 → 대전", km: 140},
                {title: "대전 → 김천", km: 80},
                {title: "김천 → 대구", km: 70},
            ]
        };
    } else if (maxKm < 500) {
        actualTrip = {
            origin: "서울",
            destination: "부산",
            totalKm: 325,
            segments: [
                {title: "서울 → 대전", km: 140},
                {title: "대전 → 대구", km: 130},
                {title: "대구 → 부산", km: 55},
            ]
        };
    } else if (maxKm < 1000) {
        actualTrip = {
            origin: "서울",
            destination: "제주",
            totalKm: 470,
            segments: [
                {title: "서울 → 목포", km: 280},
                {title: "목포 → 제주항 (페리)", km: 100},
                {title: "제주항 → 제주시", km: 90},
            ]
        };
    } else if (maxKm < 1200) {
        actualTrip = {
            origin: "서울",
            destination: "상하이",
            totalKm: 950,
            segments: [
                {title: "서울 → 인천항", km: 50},
                {title: "인천 → 상하이항 (페리)", km: 800},
                {title: "상하이항 → 상하이시", km: 100},
            ]
        };
    } else {
        actualTrip = {
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
    
    // 현실적인 전비 계산 (수정됨)
    let actualEfficiency: number;
    
    if (powerKwh < 0.01) {
        // 전력량이 너무 적으면 기본 전비 사용
        actualEfficiency = 5.2;
    } else {
        // 계산된 전비를 현실적 범위로 제한
        const calculatedEfficiency = actualTrip.totalKm / powerKwh;
        actualEfficiency = Math.max(3.0, Math.min(7.0, calculatedEfficiency));
    }
    
    console.log('선택된 경로:', actualTrip);
    console.log('실제 전비:', actualEfficiency, 'km/kWh');
    
    return {
        ...actualTrip,
        actualEfficiency
    };
}

// 사용자 토큰 데이터 기반으로 동적 KPI 생성
function generateKPIs(savedTokens: number, powerKwh: number, efficiency: number): Array<{ 
    icon: string; 
    label: string; 
    value: string; 
    hint?: string 
}> {
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
            value: `${efficiency.toFixed(1)} km/kWh`,
            hint: efficiency > 5.2 ? "평균보다 효율적!" : "아이오닉 5 평균"
        },
    ];
}

// API 데이터 기반으로 CarModal 데이터 생성
export function createCarModalData(
    savedTokens: number, 
    scope: "me" | "all",
    // 향후 추가될 실제 주행 데이터
    actualData?: {
        totalDistanceDriven?: number;
        totalPowerConsumed?: number;
        averageEfficiency?: number;
    }
): CarModalData {
    // null 안전성 처리 및 디버깅
    const safeTokens = Math.max(0, savedTokens || 0);
    console.log('createCarModalData 호출:', { savedTokens, safeTokens, scope, actualData });
    
    const powerKwh = calculatePowerFromTokens(safeTokens);
    console.log('계산된 전력량:', powerKwh, 'kWh');
    
    // 실제 주행 데이터가 있으면 실제 전비 계산, 없으면 기본값 사용
    let baseEfficiency = 5.2; // 기본값
    if (actualData?.totalDistanceDriven && actualData?.totalPowerConsumed) {
        baseEfficiency = calculateEfficiency(actualData.totalDistanceDriven, actualData.totalPowerConsumed);
    } else if (actualData?.averageEfficiency) {
        baseEfficiency = actualData.averageEfficiency;
    }
    
    const tripData = getTripByDistance(powerKwh, baseEfficiency);
    console.log('선택된 여행:', tripData);
    
    const kpis = generateKPIs(safeTokens, powerKwh, tripData.actualEfficiency);
    console.log('생성된 KPIs:', kpis);
    
    // 목표 계산: 목적지까지 가는데 필요한 전력량 (현실적 전비 기준)
    const goalPowerKwh = Math.max(1, Math.ceil(tripData.totalKm / tripData.actualEfficiency));
    console.log('목표 전력량:', goalPowerKwh, 'kWh');
    
    const result = {
        power: { 
            current: powerKwh, 
            goal: goalPowerKwh, 
            step: scope === "me" ? 1 : 5  // 개인은 1kWh씩, 전체는 5kWh씩
        },
        trip: {
            origin: tripData.origin,
            destination: tripData.destination,
            totalKm: tripData.totalKm
        },
        vehicle: { 
            efficiencyKmPerKwh: tripData.actualEfficiency // 현실적으로 계산된 전비
        },
        segments: tripData.segments,
        kpis,
        cta: { share: true },
    };
    
    console.log('최종 CarModal 데이터:', result);
    return result;
}

// 범위별 데이터 (실제 토큰 값 기반으로 생성)
export function getCarModalDataByScope(
    meTokens: number = 0, 
    allTokens: number = 0,
    // 향후 실제 주행 데이터 추가
    actualData?: {
        me?: { totalDistanceDriven?: number; totalPowerConsumed?: number; averageEfficiency?: number; };
        all?: { totalDistanceDriven?: number; totalPowerConsumed?: number; averageEfficiency?: number; };
    }
) {
    return {
        me: createCarModalData(meTokens, "me", actualData?.me),
        all: createCarModalData(allTokens, "all", actualData?.all),
    };
}

// 목적지 정보 가져오기 함수 (Dashboard용 - 추가됨)
export function getDestinationByTokens(savedTokens: number = 0): { 
    destination: string; 
    distance: string; 
    efficiency: string; 
} {
    const powerKwh = calculatePowerFromTokens(savedTokens);
    const tripData = getTripByDistance(powerKwh, 5.2);
    
    return {
        destination: tripData.destination,
        distance: `${tripData.totalKm}km`,
        efficiency: `${tripData.actualEfficiency.toFixed(1)} km/kWh`
    };
}

// 기본 더미 데이터 (API 연동 전 테스트용)
export const mockCarModalData: CarModalData = createCarModalData(1047, "me");

// 하위 호환성을 위한 정적 데이터 (deprecated)
export const carModalDataByScope: Record<"me" | "all", CarModalData> = {
    me: createCarModalData(1047, "me"),      // 예시: 개인 1047토큰
    all: createCarModalData(13442, "all"),   // 예시: 전체 13442토큰
};