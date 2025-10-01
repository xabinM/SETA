import type {CarModalData} from "./types";

function calculateEfficiency(totalDistance: number, totalPowerUsed: number): number {
    if (totalPowerUsed === 0) return 5.2;
    return totalDistance / totalPowerUsed;
}

function calculatePowerFromTokens(savedTokens: number): number {
    return Math.max(0, savedTokens) / 1000;
}

const tripSegments = [
    {
        maxKm: 50,
        origin: "강남",
        destination: "인천공항",
        totalKm: 45,
        segments: [
            {title: "강남 → 가산디지털단지", km: 12},
            {title: "가산디지털단지 → 김포공항", km: 18},
            {title: "김포공항 → 인천공항", km: 15},
        ],
    },
    {
        maxKm: 150,
        origin: "서울",
        destination: "대전",
        totalKm: 140,
        segments: [
            {title: "서울 → 수원", km: 30},
            {title: "수원 → 천안", km: 50},
            {title: "천안 → 대전", km: 60},
        ],
    },
    {
        maxKm: 320,
        origin: "서울",
        destination: "대구",
        totalKm: 290,
        segments: [
            {title: "서울 → 대전", km: 140},
            {title: "대전 → 김천", km: 80},
            {title: "김천 → 대구", km: 70},
        ],
    },
    {
        maxKm: 500,
        origin: "서울",
        destination: "부산",
        totalKm: 325,
        segments: [
            {title: "서울 → 대전", km: 140},
            {title: "대전 → 대구", km: 130},
            {title: "대구 → 부산", km: 55},
        ],
    },
    {
        maxKm: 1000,
        origin: "서울",
        destination: "제주",
        totalKm: 470,
        segments: [
            {title: "서울 → 목포", km: 280},
            {title: "목포 → 제주항 (페리)", km: 100},
            {title: "제주항 → 제주시", km: 90},
        ],
    },
    {
        maxKm: 1200,
        origin: "서울",
        destination: "상하이",
        totalKm: 950,
        segments: [
            {title: "서울 → 인천항", km: 50},
            {title: "인천 → 상하이항 (페리)", km: 800},
            {title: "상하이항 → 상하이시", km: 100},
        ],
    },
    {
        maxKm: Infinity,
        origin: "서울",
        destination: "도쿄",
        totalKm: 1160,
        segments: [
            {title: "서울 → 부산", km: 325},
            {title: "부산 → 후쿠오카 (페리)", km: 235},
            {title: "후쿠오카 → 도쿄", km: 600},
        ],
    },
];

function getTripByDistance(
    powerKwh: number,
    baseEfficiency: number = 5.2,
    scope: "me" | "all" = "me"
): {
    origin: string;
    destination: string;
    totalKm: number;
    segments: Array<{ title: string; km: number }>;
    actualEfficiency: number;
} {
    console.log('getTripByDistance 입력값:', {powerKwh, baseEfficiency, scope});

    const efficiency = Math.max(3.0, Math.min(7.0, baseEfficiency));

    let maxKm = Math.round(powerKwh * efficiency);

    if (scope === "all") {
        maxKm = Math.round(maxKm * 3);
        console.log('전체 모드: maxKm 3배 증가:', maxKm);
    }

    console.log('계산된 maxKm:', maxKm);
    const trip = tripSegments.find(segment => maxKm < segment.maxKm) || tripSegments[tripSegments.length - 1];
    let actualEfficiency: number;
    if (powerKwh < 0.01) {
        actualEfficiency = baseEfficiency;
    } else if (maxKm >= trip.totalKm) {
        actualEfficiency = Math.max(3.0, Math.min(7.0, trip.totalKm / powerKwh));
    } else {
        const possibleDistance = Math.min(maxKm, trip.totalKm);
        actualEfficiency = Math.max(3.0, Math.min(7.0, possibleDistance / powerKwh));
    }

    console.log('선택된 경로:', trip);
    console.log('계산된 실제 전비:', actualEfficiency, 'km/kWh');

    return {
        ...trip,
        actualEfficiency
    };
}

function generateKPIs(savedTokens: number, powerKwh: number, efficiency: number): Array<{
    icon: string;
    label: string;
    value: string;
    hint?: string
}> {
    const costSaving = Math.round(powerKwh * 110);
    const co2Reduction = Math.round(powerKwh * 0.2);
    const treesEquivalent = Math.max(1, Math.round(co2Reduction / 22));

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

export function createCarModalData(
    savedTokens: number,
    scope: "me" | "all",
    actualData?: {
        totalDistanceDriven?: number;
        totalPowerConsumed?: number;
        averageEfficiency?: number;
    }
): CarModalData {
    const safeTokens = Math.max(0, savedTokens || 0);
    console.log('createCarModalData 호출:', {savedTokens, safeTokens, scope, actualData});
    const powerKwh = calculatePowerFromTokens(safeTokens);
    console.log('계산된 전력량:', powerKwh, 'kWh');
    let baseEfficiency = 5.2;
    if (scope === "all") {
        baseEfficiency = 5.8;
    }

    if (actualData?.totalDistanceDriven && actualData?.totalPowerConsumed) {
        baseEfficiency = calculateEfficiency(actualData.totalDistanceDriven, actualData.totalPowerConsumed);
    } else if (actualData?.averageEfficiency) {
        baseEfficiency = actualData.averageEfficiency;
    }

    console.log('사용할 기본 전비:', baseEfficiency);
    const tripData = getTripByDistance(powerKwh, baseEfficiency, scope);
    console.log('선택된 여행:', tripData);

    const kpis = generateKPIs(safeTokens, powerKwh, tripData.actualEfficiency);
    console.log('생성된 KPIs:', kpis);
    const goalPowerKwh = Math.max(1, Math.ceil(tripData.totalKm / tripData.actualEfficiency));
    console.log('목표 전력량:', goalPowerKwh, 'kWh');

    const result = {
        power: {
            current: powerKwh,
            goal: goalPowerKwh,
            step: scope === "me" ? 1 : 5
        },
        trip: {
            origin: tripData.origin,
            destination: tripData.destination,
            totalKm: tripData.totalKm
        },
        vehicle: {
            efficiencyKmPerKwh: tripData.actualEfficiency
        },
        segments: tripData.segments,
        kpis,
        cta: {share: true},
    };

    console.log('최종 CarModal 데이터:', result);
    return result;
}

export function getDestinationByTokens(
    savedTokens: number = 0,
    scope: "me" | "all" = "me"
): {
    destination: string;
    distance: string;
    efficiency: string;
} {
    const powerKwh = calculatePowerFromTokens(savedTokens);

    let baseEfficiency = 5.2;
    if (scope === "all") {
        baseEfficiency = 5.8;
    }

    const tripData = getTripByDistance(powerKwh, baseEfficiency, scope);

    console.log('getDestinationByTokens:', {savedTokens, scope, powerKwh, tripData});

    return {
        destination: tripData.destination,
        distance: `${tripData.totalKm}km`,
        efficiency: `${tripData.actualEfficiency.toFixed(1)} km/kWh`
    };
}