"use client";

import LatexBlock from "./LatexBlock";

import MindMapEditor from "./MindMapEditor";
import { ChemistryRenderer } from "./whiteboard/renderers/ChemistryRenderer";
import { ChartRenderer } from "./whiteboard/renderers/ChartRenderer";
import { useWhiteboard } from "@/components/WhiteboardProvider";
import type { WhiteboardContentBlock, WhiteboardBlock } from "@/types/whiteboardSession";

type Props = {
    block: WhiteboardBlock;
};

export default function WhiteboardBlockRenderer({ block }: Props) {
    const { updateBlock } = useWhiteboard();

    switch (block.type) {
        case "note":
            return (
                <div className="text-zinc-300 text-sm leading-relaxed p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    {block.content}
                </div>
            );

        case "latex":
            return (
                <div className="w-full bg-black/20 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                    <LatexBlock latex={block.content} />
                </div>
            );

        case "table":
            return (
                <div className="overflow-x-auto rounded-lg border border-zinc-600 bg-[#0b0b0b]">
                    <table className="w-full text-sm text-left text-zinc-200 border-collapse">
                        <thead className="text-xs uppercase bg-zinc-900 text-zinc-300 font-semibold">
                            <tr>
                                {block.headers.map((h, i) => (
                                    <th key={i} className="px-4 py-3 border border-zinc-600">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.map((row, i) => (
                                <tr key={i} className="border-b border-zinc-600 hover:bg-zinc-800/20">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-4 py-2 border border-zinc-600">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case "mindmap":
            return (
                <div className="w-full">
                    <MindMapEditor root={block.root} nodes={block.nodes} />
                </div>
            );

        case "chemistry":
            // Render reaction participants
            // For now, let's render the FIRST product or reactant as a demo if no simpler structure mode
            // Or better, iterate and show them? 
            // The ChemistryRenderer takes a single element with SMILES.
            // We'll map the block content to that.

            // If it has a specific reaction structure
            const molecules = [
                ...(block.content.reactants || []),
                ...(block.content.products || [])
            ];

            if (molecules.length === 0 && block.content.structure) {
                molecules.push({ name: block.content.label || "Molecule", smiles: block.content.structure });
            }

            return (
                <div className="flex flex-col gap-4 p-4 bg-white rounded-xl">
                    {block.content.reaction_name && (
                        <div className="text-black font-bold text-center border-b pb-2 mb-2">
                            {block.content.reaction_name}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-8 justify-center items-center">
                        {molecules.map((mol, i) => (
                            <div key={i} className="relative w-[200px] h-[200px]">
                                <ChemistryRenderer
                                    element={{
                                        id: `chem-${i}`,
                                        type: 'chemistry',
                                        x: 0, y: 0,
                                        smiles: mol.smiles,
                                        label: mol.name,
                                        visible: true
                                    }}
                                    viewport={{ width: 200, height: 200, coordinateSystem: 'absolute' }}
                                />
                            </div>
                        ))}
                    </div>
                    {block.content.conditions && (
                        <div className="text-gray-600 text-sm text-center italic mt-2">
                            Conditions: {block.content.conditions}
                        </div>
                    )}
                </div>
            );

        case "chart":
            return (
                <div className="relative w-full h-[300px] bg-white rounded-xl p-4">
                    <ChartRenderer
                        element={{
                            id: block.id,
                            type: 'chart',
                            x: 0, y: 0,
                            width: 500, // Fixed width for card buffer
                            height: 300,
                            visible: true,
                            chartType: block.content.chartType as "line" | "bar" | "pie", // Explicit Cast for now to fix TS
                            function: block.content.math_function,
                            domain: block.content.domain,
                            // Map data if present
                            data: block.content.data ? { datasets: [{ data: block.content.data }] } : undefined
                        }}
                        viewport={{ width: 500, height: 300, coordinateSystem: 'absolute' }}
                    />
                    {(block.content.x_label || block.content.y_label) && (
                        <div className="absolute bottom-2 right-4 text-xs text-gray-400">
                            {block.content.x_label} / {block.content.y_label}
                        </div>
                    )}
                </div>
            );

        case "canvas":
            // DEPRECATED: Handled by WhiteboardRenderer (Layer 1)
            return null;

        default:
            return null;
    }
}
