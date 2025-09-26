import {useState, useEffect} from "react";
import {getDashboardKpi, type DashboardKpiResponse} from "./api";

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
    if (costUsd === null || costUsd === undefined) {
        return "₩0";
    }

    const krw = Math.round(costUsd * 1400);
    return `₩${krw.toLocaleString()}`;
}

export function formatCO2(savedTokens: number): string {
    const co2Grams = savedTokens / 1000;

    if (co2Grams < 1) {
        return `${co2Grams.toFixed(1)}g`;
    }

    if (co2Grams < 1000) {
        return `${Math.round(co2Grams)}g`;
    }

    if (co2Grams < 10000) {
        return `${(co2Grams / 1000).toFixed(2)}kg`;
    }

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