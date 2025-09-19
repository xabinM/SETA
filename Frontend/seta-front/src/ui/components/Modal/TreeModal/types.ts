import type { ReactNode } from "react";

export type Tokens = { current: number; goal: number; step: number };

export type Tree = {
    emoji: string;
    label: string;
    achieved: boolean;
};

export type KPI = {
    icon: ReactNode;       // ← string → ReactNode 로 변경
    value: string;
    label: string;
    hint?: string;
    ariaLabel?: string;
};

export type TimelineItem = {
    icon: ReactNode;       // ← string → ReactNode 로 변경 (이모지/이미지 모두 허용)
    title: string;
    status: "done" | "progress" | "upcoming";
    date: string;
    desc: string;
};

export interface TreeModalProps {
    open: boolean;
    onClose: () => void;
    tokens: Tokens;
    trees: Tree[];
    kpis: KPI[];
    timeline: TimelineItem[];
}
