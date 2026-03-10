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
                relative px-4 py-2 rounded-lg border 
                ${level === 0 ? "bg-blue-600/20 border-blue-500/50 text-blue-100 font-bold text-lg" : ""}
                ${level === 1 ? "bg-purple-600/20 border-purple-500/50 text-purple-100 font-semibold" : ""}
                ${level >= 2 ? "bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm" : ""}
                backdrop-blur-sm shadow-lg transition hover:scale-105 cursor-default
            `}>
                {node.title}
            </div>

            {hasChildren && (
                <div className="flex flex-col items-center mt-4 w-full">
                    {/* Connector Line Vertical */}
                    <div className="w-px h-6 bg-zinc-600 mb-0"></div>

                    {/* Connector Line Horizontal (across children) */}
                    {node.children!.length > 1 && (
                        <div className="w-[80%] h-px bg-zinc-600 mb-4"></div>
                    )}

                    <div className="flex flex-wrap justify-center gap-8 relative">
                        {node.children!.map((child, i) => (
                            <div key={i} className="flex flex-col items-center relative">
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
        <div className="w-full overflow-x-auto p-4 flex justify-center min-h-[300px] bg-[#0b0b0b] rounded-xl border border-dashed border-zinc-800">
            <div className="min-w-fit flex flex-col items-center">
                <TreeNode node={rootNode} level={0} />
            </div>
        </div>
    );
}
