// src/ui/components/Modal/CarModal/types.ts

export interface CarModalData {
    // 핵심 전력 데이터 (kWh)
    power: { current: number; goal: number; step: number };

    // 여행 정보
    trip: { origin: string; destination: string; totalKm: number };

    // 전비 (km/kWh)
    vehicle: { efficiencyKmPerKwh: number };

    // 구간 정보 (UI 표시용)
    segments: Array<{ title: string; km: number }>;

    // KPI 정보 (넘겨주지 않으면 CarModal이 내부에서 power.current로 자동 생성)
    kpis?: Array<{ icon: string; label: string; value: string; hint?: string }>;

    // 옵션
    cta?: { share?: boolean };
}

// CarModal 컴포넌트 props (데이터는 부분적으로만 넘겨도 됨)
export interface CarModalProps extends Partial<CarModalData> {
    open: boolean;
    onClose: () => void;
}
