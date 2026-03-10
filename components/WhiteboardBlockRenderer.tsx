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
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 text-sm leading-relaxed text-zinc-300">
                    {block.content}
                </div>
            );

        case "latex":
            return (
                <div className="w-full rounded-lg border border-white/5 bg-black/20 p-4 backdrop-blur-sm">
                    <LatexBlock latex={block.content} />
                </div>
            );

        case "table":
            return (
                <div className="overflow-x-auto rounded-lg border border-zinc-600 bg-[#0b0b0b]">
                    <table className="w-full border-collapse text-left text-sm text-zinc-200">
                        <thead className="bg-zinc-900 text-xs font-semibold uppercase text-zinc-300">
                            <tr>
                                {block.headers.map((h, i) => (
                                    <th key={i} className="border border-zinc-600 px-4 py-3">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {block.rows.map((row, i) => (
                                <tr key={i} className="border-b border-zinc-600 hover:bg-zinc-800/20">
                                    {row.map((cell, j) => (
                                        <td key={j} className="border border-zinc-600 px-4 py-2">
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
                <div className="flex flex-col gap-4 rounded-xl bg-white p-4">
                    {block.content.reaction_name && (
                        <div className="mb-2 border-b pb-2 text-center font-bold text-black">
                            {block.content.reaction_name}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-8">
                        {molecules.map((mol, i) => (
                            <div key={i} className="relative size-[200px]">
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
                        <div className="mt-2 text-center text-sm italic text-gray-600">
                            Conditions: {block.content.conditions}
                        </div>
                    )}
                </div>
            );

        case "chart":
            return (
                <div className="relative h-[300px] w-full rounded-xl bg-white p-4">
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
