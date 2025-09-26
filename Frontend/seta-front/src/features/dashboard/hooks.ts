import { useState, useEffect } from "react";
import { getDashboardKpi, type DashboardKpiResponse } from "./api";

// 값을 포맷팅하는 유틸리티 함수들
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
}

export function formatCost(costUsd: number | null): string {
    // null이거나 undefined인 경우 0으로 처리
    if (costUsd === null || costUsd === undefined) {
        return "₩0";
    }
    
    // USD를 KRW로 변환 (환율: 1 USD = 1400 KRW 가정)
    const krw = Math.round(costUsd * 1400);
    return `₩${krw.toLocaleString()}`;
}

export function formatCO2(savedTokens: number): string {
  const co2Grams = savedTokens / 1000;

  // 1g 미만일 땐 소수점 한 자리까지 표시해 의미 살리기
  if (co2Grams < 1) {
    return `${co2Grams.toFixed(1)}g`;
  }

  // 1g 이상 1000g 미만은 반올림 처리 (소수점 제거)
  if (co2Grams < 1000) {
    return `${Math.round(co2Grams)}g`;
  }

  // 1kg 이상 10kg 미만은 소수점 둘째 자리까지 표시
  if (co2Grams < 10000) {
    return `${(co2Grams / 1000).toFixed(2)}kg`;
  }

  // 10kg 이상부터는 정수 kg 단위로 표시하며 강조 효과(예: 쉼표 추가)
  return `${Math.round(co2Grams / 1000).toLocaleString()}kg`;
}


export function useDashboardKpi() {
    const [data, setData] = useState<DashboardKpiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getDashboardKpi();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
            console.error("Dashboard KPI fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
    };
}