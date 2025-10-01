import {useState, useEffect} from "react";
import {getDashboardKpi, type DashboardKpiResponse} from "./api";

const CO2_G_PER_TOKEN = 0.0003;

function calcCO2(tokens: number | undefined | null): number {
    if (!tokens) return 0;
    const result = tokens * CO2_G_PER_TOKEN;
    console.log('CO2 계산:', {tokens, CO2_G_PER_TOKEN, result});
    return result;
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

            const withCo2: DashboardKpiResponse = {
                ...result,
                userTotal: {
                    ...result.userTotal,
                    co2: calcCO2(result.userTotal?.savedTokens),
                },
                userDaily: {
                    ...result.userDaily,
                    co2: calcCO2(result.userDaily?.savedTokens),
                },
                globalTotal: {
                    ...result.globalTotal,
                    co2: calcCO2(result.globalTotal?.savedTokens),
                },
                globalDaily: {
                    ...result.globalDaily,
                    co2: calcCO2(result.globalDaily?.savedTokens),
                },
            };

            setData(withCo2);
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
