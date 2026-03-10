import type { CanvasPayload } from "@/components/canvasTypes";
import type { ChemCanvasPayload } from "@/components/chemistryTypes";

export type MindMapNode = {
    id: string;
    title: string;
    children?: MindMapNode[];
};

export type WhiteboardContentBlock =
    | {
        type: "latex";
        content: string;
    }
    | {
        type: "table";
        headers: string[];
        rows: string[][];
    }
    | {
        type: "canvas";
        payload: CanvasPayload | ChemCanvasPayload;
    }
    | {
        type: "note";
        content: string;
    }
    | {
        type: "mindmap";
        root: string;
        nodes: MindMapNode[];
    }
    | {
        type: "chemistry";
        content: {
            reaction_name?: string;
            reactants?: Array<{ name: string; smiles: string }>;
            products?: Array<{ name: string; smiles: string }>;
            conditions?: string;
            // Support simple structure mode too
            structure?: string; // SMILES
            label?: string;
        };
    }
    | {
        type: "chart";
        content: {
            chartType: "line" | "bar" | "pie" | "area";
            math_function?: string;
            domain?: [number | string, number | string];
            data?: any[]; // Fallback for raw data
            x_label?: string;
            y_label?: string;
        };
    };

export type WhiteboardBlock = WhiteboardContentBlock & {
    id: string;
    createdAt: number;
};

export type WhiteboardSession = {
    sessionId: string;
    title?: string;
    updatedAt: number;
    blocks: WhiteboardBlock[];
};
