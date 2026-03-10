import type { CanvasElement } from "@/components/canvasTypes";

export const DEMO_WHITEBOARD_SEQUENCE = [
    {
        step: 1,
        explain: "Entry check: Title Display",
        draw: [
            { type: "box", label: "WHITEBOARD DEMO", zone: "CENTER", row: 1, width: 3 },
            { type: "text", value: "Rendering Engine Check", zone: "CENTER", row: 2 }
        ]
    },
    {
        step: 2,
        explain: "Flow Expansion - Left to Right",
        draw: [
            { type: "box", label: "INPUT", zone: "LEFT", row: 3 },
            { type: "box", label: "RENDERER", zone: "CENTER", row: 3 },
            { type: "box", label: "OUTPUT", zone: "RIGHT", row: 3 },
            { type: "arrow", fromZone: "LEFT", fromRow: 3, toZone: "CENTER", toRow: 3 },
            { type: "arrow", fromZone: "CENTER", fromRow: 3, toZone: "RIGHT", toRow: 3 }
        ]
    },
    {
        step: 3,
        explain: "Interaction Proof - Pan & Drag",
        draw: [
            { type: "text", value: "Drag background = Pan | Drag box = Move", zone: "CENTER", row: 0 },
            { type: "box", label: "DRAG ME", zone: "CENTER", row: 5 }
        ]
    },
    {
        step: 4,
        explain: "Rendering Test - Chemical Formula (LaTeX)",
        draw: [
            {
                type: "latex",
                content: "2H_2 + O_2 \\xrightarrow{combustion} 2H_2O",
                zone: "CENTER",
                row: 4
            }
        ]
    },
    {
        step: 5,
        explain: "Completion - Verified",
        draw: [
            { type: "text", value: "✅ RENDERING VERIFIED", zone: "CENTER", row: 5 }
        ]
    }
];
