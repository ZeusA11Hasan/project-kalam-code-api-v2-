export type CanvasElement =
    | { type: "line"; from: [number, number]; to: [number, number] }
    | {
        type: "arrow";
        // Direct Coords
        from?: [number, number];
        to?: [number, number];
        // Grid Coords
        fromZone?: "LEFT" | "CENTER" | "RIGHT" | "TOP" | "BOTTOM";
        fromRow?: number;
        fromCol?: number;
        toZone?: "LEFT" | "CENTER" | "RIGHT" | "TOP" | "BOTTOM";
        toRow?: number;
        toCol?: number;
    }
    | { type: "curve"; equation: string; range: [number, number] }
    | { type: "point"; at: [number, number] }
    | { type: "label"; text: string; at: [number, number] }
    // Phase 3: Grid Layout Schema
    | {
        type: "text";
        value: string;
        zone?: "LEFT" | "CENTER" | "RIGHT" | "TOP" | "BOTTOM";
        row?: number;
        col?: number;
        // Fallback or explicit override
        x?: number;
        y?: number
    }
    | {
        type: "box";
        label?: string;
        zone?: "LEFT" | "CENTER" | "RIGHT" | "TOP" | "BOTTOM";
        row?: number;
        col?: number;
        width?: number;
        height?: number;
        x?: number;
        y?: number
    }
    | { type: "system_cooldown"; seconds: number; x: number; y: number }
    | {
        type: "latex";
        content: string;
        zone?: "LEFT" | "CENTER" | "RIGHT" | "TOP" | "BOTTOM";
        row?: number;
        col?: number;
        x?: number;
        y?: number;
    };

export type CanvasStep = {
    stepId: number;
    title?: string;
    elements: CanvasElement[];
};

export type CanvasSequenceStep = {
    step: number;
    explain: string;
    draw: CanvasElement[];
};

export type CanvasPayload = {
    axes?: boolean;
    title?: string;
    // New Phase 2 Schema
    sequence?: CanvasSequenceStep[];

    // Legacy support (Phase 1)
    steps?: string[];
    elements?: CanvasElement[];
    legacySteps?: CanvasStep[];
};
