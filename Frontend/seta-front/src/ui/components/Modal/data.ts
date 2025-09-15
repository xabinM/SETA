import type { Tokens, Tree, KPI, TimelineItem } from "./types";

const fmt = (n: number) => n.toLocaleString();

export const tokens: Tokens = {
    current: 1047,
    goal: 1500,
    step: 500,
};

export const trees: Tree[] = [
    { emoji: "🌱", label: `${fmt(500)}토큰`,  achieved: true  },
    { emoji: "🌿", label: `${fmt(1000)}토큰`, achieved: true  },
    { emoji: "🌳", label: `${fmt(1247)}토큰`, achieved: true  },
    { emoji: "🌲", label: `${fmt(1500)}토큰`, achieved: false },
    { emoji: "🌴", label: `${fmt(2000)}토큰`, achieved: false },
];

export const kpis: KPI[] = [
    { icon: "💰", value: "₩2,480", label: "누적 비용 절약", hint: "평균 ₩2.00/토큰" },
    { icon: "🌍", value: "0.8kg",  label: "CO2 절감량",    hint: "나무 3그루 흡수량과 동일" },
    { icon: "⚡", value: "2.4kWh",  label: "에너지 절약",    hint: "가정용 전력 1일 사용량" },
    { icon: "📈", value: "15일",    label: "연속 절약 일수", hint: "하루 83토큰 절약" },
];

export const timeline: TimelineItem[] = [
    { icon: "🌱", title: "첫 번째 새싹이 자랐어요!", status: "done",     date: "2024.08.25", desc: "500토큰을 절약하여 첫 번째 나무를 심었습니다. 환경보호 여정의 시작!" },
    { icon: "🌿", title: "두 번째 나무가 자랐어요!", status: "done",     date: "2024.09.02", desc: "1,000토큰 달성! 꾸준한 절약으로 작은 숲이 만들어지고 있어요." },
    { icon: "🌳", title: "세 번째 나무 완성!",       status: "done",     date: "2024.09.10", desc: "1,247토큰으로 세 번째 나무까지! 이제 작은 숲의 모습을 갖추었네요." },
    { icon: "🌲", title: "네 번째 나무 자라는 중...", status: "progress", date: "진행 중",     desc: "1,500토큰을 목표로 열심히 자라고 있어요. 253토큰만 더 절약하면 완성!" },
    { icon: "🌴", title: "다섯 번째 나무 심기",       status: "upcoming", date: "예정",        desc: "2,000토큰 달성 시 다섯 번째 나무를 심을 수 있어요." },
];
