import type { CarModalData } from "./types";

// 자동 계산 함수들
const calculateKPIs = (currentKwh: number, efficiency: number) => {
    const co2Reduction = Math.round(currentKwh * 0.2); // 1kWh당 0.2kg CO2 절감
    const costSavings = Math.round(currentKwh * 110); // 1kWh당 110원 절약
    const equivKm = Math.round(currentKwh * efficiency);
    
    return {
        power: `${currentKwh} kWh`,
        co2: `${co2Reduction} kg`,
        cost: `${costSavings.toLocaleString()} 원`,
        efficiency: `${efficiency} km/kWh`,
        equivKm: `${equivKm} km`
    };
};

export const mockCarModalData: CarModalData = {
    // 전력량 기반 데이터 (TreeModal의 tokens와 동일한 구조)
    power: {
        current: 10,  // 현재 절약 전력량 (kWh) - 이 값만 바꾸면 모든 것이 자동 계산됨!
        goal: 200,     // 목표 전력량 (kWh)
        step: 20,      // 단계별 전력량 (kWh)
    },
    
    // 여행 정보
    trip: {
        origin: "서울",
        destination: "부산",
        totalKm: 400,
    },
    
    // 전기차 정보
    vehicle: {
        efficiencyKmPerKwh: 6, // 1kWh당 6km 주행
    },
    
    // 구간 정보
    segments: [
        { title: "서울 → 대전", km: 140 },
        { title: "대전 → 대구", km: 130 },
        { title: "대구 → 부산", km: 130 },
    ],
    
    // KPI 정보 (자동 계산)
    kpis: (() => {
        const currentKwh = 140; // power.current 값
        const efficiency = 6; // vehicle.efficiencyKmPerKwh 값
        const kpis = calculateKPIs(currentKwh, efficiency);
        
        return [
            { icon: "🔋", label: "누적 전력 절약", value: kpis.power },
            { icon: "🌿", label: "CO₂ 절감", value: kpis.co2 },
            { icon: "💰", label: "비용 절감", value: kpis.cost },
            { icon: "⚙️", label: "전비", value: kpis.efficiency },
        ];
    })(),
    
    // 옵션
    cta: {
        share: true,
    },
};
