// src/ui/components/Modal/TreeModal/data.ts
import type { Tokens, Tree, KPI, TimelineItem } from "./types";

const fmt = (n: number) => n.toLocaleString();

/** ===== 개인 데이터 ===== */
const meTokens: Tokens = { current: 1047, goal: 1500, step: 500 };

const meTrees: Tree[] = [
    { emoji: "🌱", label: `${fmt(500)}토큰`,  achieved: true  },
    { emoji: "🌿", label: `${fmt(1000)}토큰`, achieved: true  },
    { emoji: "🌳", label: `${fmt(1247)}토큰`, achieved: true  },
    { emoji: "🌲", label: `${fmt(1500)}토큰`, achieved: false },
    { emoji: "🌴", label: `${fmt(2000)}토큰`, achieved: false },
];

const meKpis: KPI[] = [
    {
        icon: "💰",
        value: "₩2,480",
        label: "누적 비용 절약",
        hint: "평균 ₩2.00/토큰"
    },
    {
        icon: "🌍",
        value: "0.8kg",
        label: "CO₂ 절감량",
        hint: "나무 3그루 흡수량과 동일"
    },
    {
        icon: (
            <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/High%20Voltage.png" alt="High Voltage" width="25" height="25" />
        ),
        value: "2.4kWh",
        label: "에너지 절약",
        hint: "가정용 전력 1일 사용량"
    },
    {
        icon: (
            <img
                src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Spiral%20Calendar.png"
                alt="Spiral Calendar"
                width={25}
                height={25}
            />
        ),
        value: "15일",
        label: "연속 절약 일수",
        hint: "하루 83토큰 절약" },
];

const meTimeline: TimelineItem[] = [
    { icon: "🌱", title: "첫 번째 새싹이 자랐어요!", status: "done",     date: "2024.08.25", desc: "500토큰을 절약하여 첫 번째 나무를 심었습니다. 환경보호 여정의 시작!" },
    { icon: "🌿", title: "두 번째 나무가 자랐어요!", status: "done",     date: "2024.09.02", desc: "1,000토큰 달성! 꾸준한 절약으로 작은 숲이 만들어지고 있어요." },
    { icon: "🌳", title: "세 번째 나무 완성!",       status: "done",     date: "2024.09.10", desc: "1,247토큰으로 세 번째 나무까지! 이제 작은 숲의 모습을 갖추었네요." },
    { icon: "🌲", title: "네 번째 나무 자라는 중...", status: "progress", date: "진행 중",     desc: "1,500토큰을 목표로 열심히 자라고 있어요. 253토큰만 더 절약하면 완성!" },
    { icon: "🌴", title: "다섯 번째 나무 심기",       status: "upcoming", date: "예정",        desc: "2,000토큰 달성 시 다섯 번째 나무를 심을 수 있어요." },
];

/** ===== 전체 데이터 ===== */
const allTokens: Tokens = { current: 13442, goal: 20000, step: 5000 };

const allTrees: Tree[] = [
    { emoji: "🌱", label: `${fmt(5000)}토큰`,   achieved: true  },
    { emoji: "🌿", label: `${fmt(10000)}토큰`,  achieved: true  },
    { emoji: "🌳", label: `${fmt(15000)}토큰`,  achieved: false },
    { emoji: "🌲", label: `${fmt(20000)}토큰`,  achieved: false },
    { emoji: "🌴", label: `${fmt(30000)}토큰`,  achieved: false },
];

export const allKpis: KPI[] = [
    {
        icon: "💰",
        value: "₩27,350",
        label: "누적 비용 절약",
        hint: "평균 ₩2.03/토큰"
    },
    {
        icon: "🌍",
        value: "9.1kg",
        label: "CO₂ 절감량",
        hint: "나무 36그루 흡수량과 동일"
    },
    {
        icon: (
            <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/High%20Voltage.png" alt="High Voltage" width="25" height="25" />
        ),
        value: "24.8kWh",
        label: "에너지 절약",
        hint: "소형 사무실 1일 사용량"
    },
    {
        icon: (
            <img
                src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Spiral%20Calendar.png"
                alt="Spiral Calendar"
                width={25}
                height={25}
            />
        ),
        value: "22일",
        label: "연속 절약 일수",
        hint: "하루 612토큰 절약",
    },
];

const allTimeline: TimelineItem[] = [
    { icon: "🌱", title: "작은 숲의 시작",     status: "done",     date: "2024.07.18", desc: "5,000토큰 달성으로 첫 숲 조성!" },
    { icon: "🌿", title: "더 푸르게",           status: "done",     date: "2024.08.21", desc: "10,000토큰 달성! 팀의 꾸준함이 빛나요." },
    { icon: "🌳", title: "세 번째 목표 진행",   status: "progress", date: "진행 중",     desc: "15,000토큰을 향해 전진 중. 조금만 더!" },
    { icon: "🌲", title: "대형 숲 완성",         status: "upcoming", date: "예정",        desc: "20,000토큰 달성 시 대형 숲 완성!" },
    { icon: "🌴", title: "확장 목표",           status: "upcoming", date: "예정",        desc: "30,000토큰 달성 시 확장 숲 프로젝트 시작!" },
];

/** ===== export: 범위별 데이터 집합 ===== */
export const treeModalDataByScope = {
    me:   { tokens: meTokens,   trees: meTrees,   kpis: meKpis,   timeline: meTimeline },
    all:  { tokens: allTokens,  trees: allTrees,  kpis: allKpis,  timeline: allTimeline },
};

export type { Tokens, Tree, KPI, TimelineItem };
