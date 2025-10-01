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
    console.log('formatCO2 호출:', co2Grams);
    
    if (!co2Grams || co2Grams === 0) return "0g";
    
    // 매우 작은 값 (1g 미만)
    if (co2Grams < 1) {
        if (co2Grams < 0.01) {
            const result = `${(co2Grams * 1000).toFixed(1)}mg`;
            console.log('formatCO2 결과 (mg):', result);
            return result;
        }
        const result = `${co2Grams.toFixed(2)}g`;
        console.log('formatCO2 결과 (소량g):', result);
        return result;
    }
    
    // 1g 이상 10g 미만 - 소수점 1자리 표시
    if (co2Grams < 10) {
        const result = `${co2Grams.toFixed(1)}g`;
        console.log('formatCO2 결과 (1-10g):', result);
        return result;
    }
    
    // 10g 이상 1kg 미만 - 반올림
    if (co2Grams < 1000) {
        const result = `${Math.round(co2Grams)}g`;
        console.log('formatCO2 결과 (10-1000g):', result);
        return result;
    }
    
    // 1kg 이상 10kg 미만 - 소수점 표시
    if (co2Grams < 10000) {
        const result = `${(co2Grams / 1000).toFixed(2)}kg`;
        console.log('formatCO2 결과 (kg):', result);
        return result;
    }
    
    // 10kg 이상
    const result = `${Math.round(co2Grams / 1000).toLocaleString()}kg`;
    console.log('formatCO2 결과 (대량kg):', result);
    return result;
}