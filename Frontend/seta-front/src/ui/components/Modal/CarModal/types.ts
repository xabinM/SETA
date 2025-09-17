// 전력량 기반 간단한 데이터 구조 (TreeModal 스타일)
export interface CarModalData {
    // 핵심 전력 데이터
    power: {
        current: number;  // 현재 절약 전력량 (kWh)
        goal: number;     // 목표 전력량 (kWh) 
        step: number;     // 단계별 전력량 (kWh)
    };

    // 여행 정보
    trip: {
        origin: string;
        destination: string;
        totalKm: number;
    };

    // 전기차 정보 (자동 계산용)
    vehicle: {
        efficiencyKmPerKwh: number; // 전비 (km/kWh) - 기본값 5
    };

    // 구간 정보
    segments: Array<{ title: string; km: number }>;

    // KPI 정보
    kpis: Array<{ icon: string; label: string; value: string; hint?: string }>;

    // 옵션
    cta?: {
        share?: boolean;
    };
}

// 컴포넌트 Props = 데이터 + 제어
export interface CarModalProps {
    open: boolean;
    onClose: () => void;
    power?: CarModalData['power'];
    trip?: CarModalData['trip'];
    vehicle?: CarModalData['vehicle'];
    segments?: CarModalData['segments'];
    kpis?: CarModalData['kpis'];
    cta?: CarModalData['cta'];
}
