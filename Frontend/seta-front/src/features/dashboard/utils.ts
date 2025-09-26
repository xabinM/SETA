export function formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toLocaleString();
}

export function formatNumberRaw(num: number): string {
    return num.toLocaleString(); 
}

export function formatCost(costUsd: number | null): string {
    if (!costUsd) return "₩0";
    const krw = Math.round(costUsd * 1400); // 환율 가정
    return `₩${krw.toLocaleString()}`;
}

export function formatCO2(co2Grams: number): string {
    if (co2Grams < 1) return `${co2Grams.toFixed(1)}g`;
    if (co2Grams < 1000) return `${Math.round(co2Grams)}g`;
    if (co2Grams < 10000) return `${(co2Grams / 1000).toFixed(2)}kg`;
    return `${Math.round(co2Grams / 1000).toLocaleString()}kg`;
}
