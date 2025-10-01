export interface CarModalData {
    power: { current: number; goal: number; step: number };
    trip: { origin: string; destination: string; totalKm: number };
    vehicle: { efficiencyKmPerKwh: number };
    segments: Array<{ title: string; km: number }>;
    kpis?: Array<{ icon: string; label: string; value: string; hint?: string }>;
    cta?: { share?: boolean };
}

export interface CarModalProps extends Partial<CarModalData> {
    open: boolean;
    onClose: () => void;
}
