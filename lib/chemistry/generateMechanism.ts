import type { ChemMechanism } from "@/components/chemistryTypes";

export function generateSN2Mechanism(
    baseStructure: any
): ChemMechanism {
    return {
        baseStructure,
        steps: [
            {
                stepId: 1,
                description: "Backside attack by nucleophile",
                arrows: [{ from: [-1.5, 0], to: [0, 0] }], // Mock positions for generic SN2
                bondChanges: [{ from: "C1", to: "LG", change: "break" }],
            },
        ],
    };
}

export function generateSN1Mechanism(
    baseStructure: any
): ChemMechanism {
    return {
        baseStructure,
        steps: [
            {
                stepId: 1,
                description: "Leaving group departs",
                bondChanges: [{ from: "C1", to: "LG", change: "break" }],
            },
            {
                stepId: 2,
                description: "Nucleophile attacks carbocation",
                arrows: [{ from: [-1.2, 0], to: [0, 0] }], // Mock positions
            },
        ],
    };
}
