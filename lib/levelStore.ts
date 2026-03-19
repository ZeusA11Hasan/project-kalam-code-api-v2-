// ════════════════════════════════════════════════════════════════
// Level Store — localStorage persistence for game progression
// ════════════════════════════════════════════════════════════════

export interface LevelData {
    id: number;
    name: string;
    emoji: string;
    xpRequired: number;
    keywords: string[];
    isFinalBoss?: boolean;
}

export const LEVELS: LevelData[] = [
    { id: 1, name: "Variables & Datatypes", emoji: "📦", xpRequired: 0, keywords: ["variable", "datatype", "string", "integer", "float", "boolean"] },
    { id: 2, name: "Loops", emoji: "🔄", xpRequired: 100, keywords: ["loop", "for loop", "while", "iteration", "range"] },
    { id: 3, name: "If / Else", emoji: "🛣️", xpRequired: 200, keywords: ["if", "else", "elif", "condition", "conditional"] },
    { id: 4, name: "Lists & Functions", emoji: "📚", xpRequired: 350, keywords: ["list", "function", "def", "append", "return"] },
    { id: 5, name: "Build Your Own AI", emoji: "🤖", xpRequired: 500, isFinalBoss: true, keywords: ["sklearn", "model", "predict", "ai done"] }
];

export interface Progress {
    currentLevel: number;
    totalXp: number;
    streak: number;
}

const STORAGE_KEY = "ollonai_progress";

const defaults: Progress = {
    currentLevel: 1,
    totalXp: 0,
    streak: 0
};

export function getProgress(): Progress {
    if (typeof window === "undefined") return { ...defaults };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaults };
        const parsed = JSON.parse(raw);
        return {
            currentLevel: parsed.currentLevel ?? 1,
            totalXp: parsed.totalXp ?? 0,
            streak: parsed.streak ?? 0
        };
    } catch {
        return { ...defaults };
    }
}

function saveProgress(p: Progress) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function addXp(amount: number): { leveledUp: boolean; newLevel?: number; previousXp: number; newXp: number } {
    const progress = getProgress();
    const previousXp = progress.totalXp;
    progress.totalXp += amount;
    const newXp = progress.totalXp;

    // Check if we should level up
    let leveledUp = false;
    let newLevelId = progress.currentLevel;

    // Find the highest level that's been reached
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (progress.totalXp >= LEVELS[i].xpRequired && LEVELS[i].id > progress.currentLevel) {
            newLevelId = LEVELS[i].id;
            leveledUp = true;
            break;
        }
    }

    if (leveledUp) {
        progress.currentLevel = newLevelId;
    }

    saveProgress(progress);
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("xpAdded", { detail: progress }));
    }
    return { leveledUp, newLevel: leveledUp ? newLevelId : undefined, previousXp, newXp };
}

export function getLevelStatus(
    levelId: number,
    currentLevel: number
): "completed" | "active" | "locked" {
    if (levelId < currentLevel) return "completed";
    if (levelId === currentLevel) return "active";
    return "locked";
}

export function incrementStreak(): void {
    const progress = getProgress();
    progress.streak += 1;
    saveProgress(progress);
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("streakUpdated", { detail: progress }));
    }
}

export function resetProgress(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}
