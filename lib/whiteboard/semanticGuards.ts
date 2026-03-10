
import { WhiteboardResponse } from "./schemas";

export function validateChemistryBlock(block: Extract<WhiteboardResponse, { render: "chemistry" }>): boolean {
    const content = block.content;

    // 1. Benzene Guard
    // If "benzene" is mentioned in reactants/products, ensure valid aromatic SMILES is used
    const allMolecules = [
        ...(content.reactants || []),
        ...(content.products || [])
    ];

    for (const mol of allMolecules) {
        if (mol.name.toLowerCase().includes("benzene")) {
            // Benzene must be c1ccccc1 (canonical) or C1=CC=CC=C1 (Kekule)
            // But we strictly want aromatic notation if possible. 
            // Let's just ban "C6H6" or empty smiles
            if (mol.smiles.trim().length < 3 || mol.smiles === "C6H6") {
                console.warn(`⚠️ [SEMANTIC GUARD] Invalid SMILES for Benzene: ${mol.smiles}`);
                return false;
            }
        }
    }

    return true;
}

export function validateGraphBlock(block: Extract<WhiteboardResponse, { render: "graph" | "chart" }>): boolean {
    const content = block.content;

    // 1. Domain Guard
    if (!content.domain || !Array.isArray(content.domain) || content.domain.length !== 2) {
        console.warn(`⚠️ [SEMANTIC GUARD] Invalid domain for graph: ${JSON.stringify(content.domain)}`);
        return false;
    }

    // 2. Label Guard (Soft)
    if (!content.x_label || !content.y_label) {
        // We allow it, but warn
        // console.warn("Graph missing labels");
    }

    return true;
}
