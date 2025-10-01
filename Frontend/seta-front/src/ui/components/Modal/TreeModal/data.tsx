import type {Tokens, Tree, KPI, TimelineItem} from "./types";

const fmt = (n: number) => n.toLocaleString();

const TREE_LEVELS = [5000, 20000, 50000, 80000, 100000];
const meTokens: Tokens = {current: 1047, goal: 2000, step: 500};

const meTrees: Tree[] = [
    {emoji: "🌱", label: `${fmt(TREE_LEVELS[0])}토큰`, achieved: true},
    {emoji: "🌿", label: `${fmt(TREE_LEVELS[1])}토큰`, achieved: false},
    {emoji: "🌳", label: `${fmt(TREE_LEVELS[2])}토큰`, achieved: false},
    {emoji: "🌲", label: `${fmt(TREE_LEVELS[3])}토큰`, achieved: false},
    {emoji: "🌴", label: `${fmt(TREE_LEVELS[4])}토큰`, achieved: false},
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
            <img
                src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/High%20Voltage.png"
                alt="High Voltage" width="25" height="25"/>
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
        hint: "하루 83토큰 절약"
    },
];

const meTimeline: TimelineItem[] = [
    {
        icon: "🌱",
        title: "첫 번째 새싹이 자랐어요!",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[0])}토큰을 절약하여 첫 번째 나무를 심었습니다.`
    },
    {
        icon: "🌿",
        title: "두 번째 나무 목표",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[1])}토큰을 목표로 열심히 자라고 있어요.`
    },
    {
        icon: "🌳",
        title: "세 번째 나무 심기",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[2])}토큰 달성 시 세 번째 나무를 심을 수 있어요.`
    },
    {
        icon: "🌲",
        title: "네 번째 나무 심기",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[3])}토큰 달성 시 네 번째 나무를 심을 수 있어요.`
    },
    {
        icon: "🌴",
        title: "다섯 번째 나무 심기",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[4])}토큰 달성 시 다섯 번째 나무를 심을 수 있어요.`
    },
];

const allTokens: Tokens = {current: 13442, goal: 20000, step: 2000};

const allTrees: Tree[] = [
    {emoji: "🌱", label: `${fmt(TREE_LEVELS[0])}토큰`, achieved: true},
    {emoji: "🌿", label: `${fmt(TREE_LEVELS[1])}토큰`, achieved: true},
    {emoji: "🌳", label: `${fmt(TREE_LEVELS[2])}토큰`, achieved: true},
    {emoji: "🌲", label: `${fmt(TREE_LEVELS[3])}토큰`, achieved: true},
    {emoji: "🌴", label: `${fmt(TREE_LEVELS[4])}토큰`, achieved: true},
];

const allKpis: KPI[] = [
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
            <img
                src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/High%20Voltage.png"
                alt="High Voltage" width="25" height="25"/>
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
    {
        icon: "🌱",
        title: "작은 숲의 시작",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[0])}토큰 달성으로 첫 숲 조성!`
    },
    {
        icon: "🌿",
        title: "더 푸르게",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[1])}토큰 달성! 팀의 꾸준함이 빛나요.`
    },
    {
        icon: "🌳",
        title: "중간 목표 달성",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[2])}토큰 달성! 숲이 더욱 울창해졌습니다.`
    },
    {
        icon: "🌲",
        title: "대형 나무 완성",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[3])}토큰 달성! 멋진 대형 나무가 자랐어요.`
    },
    {
        icon: "🌴",
        title: "최고 목표 달성",
        status: "upcoming",
        date: "",
        desc: `${fmt(TREE_LEVELS[4])}토큰 달성! 완벽한 숲이 완성되었습니다.`
    },
];

export function calculateTreeStatus(savedTokens: number): Tree[] {
    return TREE_LEVELS.map((level, index) => ({
        emoji: ["🌱", "🌿", "🌳", "🌲", "🌴"][index],
        label: `${fmt(level)}토큰`,
        achieved: savedTokens >= level
    }));
}

export function calculateNextGoal(savedTokens: number): number {
    for (const level of TREE_LEVELS) {
        if (savedTokens < level) {
            return level;
        }
    }
    return TREE_LEVELS[TREE_LEVELS.length - 1];
}

export function calculateCurrentStep(savedTokens: number): number {
    if (savedTokens < 2000) return 500;
    if (savedTokens < 5000) return 1000;
    return 2000;
}

export const treeModalDataByScope = {
    me: {tokens: meTokens, trees: meTrees, kpis: meKpis, timeline: meTimeline},
    all: {tokens: allTokens, trees: allTrees, kpis: allKpis, timeline: allTimeline},
};

export {TREE_LEVELS};
export type {Tokens, Tree, KPI, TimelineItem};