export function parseTraits(s?: string | null): string[] {
    if (!s) return [];
    return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
}

export function joinTraits(arr: string[]): string {
    return arr.join(", ");
}
