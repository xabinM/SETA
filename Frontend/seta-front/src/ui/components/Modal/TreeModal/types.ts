export type KPI = {
    icon: string;
    value: string;
    label: string;
    hint?: string;
    ariaLabel?: string;
};

export type TimelineItem = {
    icon: string;
    title: string;
    status: "done" | "progress" | "upcoming";
    date: string;
    desc: string;
};

export type Tokens = { current: number; goal: number; step: number };

export type Tree = { emoji: string; label: string; achieved: boolean };

export interface TreeModalProps {
    open: boolean;
    onClose: () => void;
    tokens: Tokens;
    trees: Tree[];
    kpis: KPI[];
    timeline: TimelineItem[];
}
