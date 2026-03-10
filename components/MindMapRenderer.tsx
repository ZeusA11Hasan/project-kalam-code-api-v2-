"use client";

import type { MindMapNode } from "@/types/whiteboardSession";

type Props = {
    root: string;
    nodes: MindMapNode[];
};

// Recursive Node Component
function TreeNode({ node, level = 0 }: { node: MindMapNode; level?: number }) {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Connection Line from Parent (if not root of subtree render) */}

            <div className={`
                relative rounded-lg border px-4 py-2 
                ${level === 0 ? "border-blue-500/50 bg-blue-600/20 text-lg font-bold text-blue-100" : ""}
                ${level === 1 ? "border-purple-500/50 bg-purple-600/20 font-semibold text-purple-100" : ""}
                ${level >= 2 ? "border-zinc-700 bg-zinc-800/50 text-sm text-zinc-300" : ""}
                cursor-default shadow-lg backdrop-blur-sm transition hover:scale-105
            `}>
                {node.title}
            </div>

            {hasChildren && (
                <div className="mt-4 flex w-full flex-col items-center">
                    {/* Connector Line Vertical */}
                    <div className="mb-0 h-6 w-px bg-zinc-600"></div>

                    {/* Connector Line Horizontal (across children) */}
                    {node.children!.length > 1 && (
                        <div className="mb-4 h-px w-[80%] bg-zinc-600"></div>
                    )}

                    <div className="relative flex flex-wrap justify-center gap-8">
                        {node.children!.map((child, i) => (
                            <div key={i} className="relative flex flex-col items-center">
                                {/* Individual connectors if needed, but flex gap handles spacing. 
                                     The unified horizontal line above is a bit tricky in pure CSS flex.
                                     For simplicity, we'll just connect direct top-down or use a simple tree layout.
                                 */}
                                <TreeNode node={child} level={level + 1} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MindMapRenderer({ root, nodes }: Props) {
    // Construct a pseudo-root if needed, or render the provided nodes as children of the "title" root
    const rootNode: MindMapNode = {
        title: root,
        children: nodes
    };

    return (
        <div className="flex min-h-[300px] w-full justify-center overflow-x-auto rounded-xl border border-dashed border-zinc-800 bg-[#0b0b0b] p-4">
            <div className="flex min-w-fit flex-col items-center">
                <TreeNode node={rootNode} level={0} />
            </div>
        </div>
    );
}
