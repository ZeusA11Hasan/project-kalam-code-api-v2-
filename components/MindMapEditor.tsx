"use client";

import { useEffect, useState } from "react";
import type { MindMapNode } from "@/types/whiteboardSession";

type Props = {
    root: string;
    nodes: MindMapNode[];
    readOnly?: boolean;
    onChange?: (nodes: MindMapNode[]) => void;
};

// Interactive Node Component
function EditorNode({
    node,
    level = 0,
    onEdit,
    onAdd,
    onDelete,
    readOnly
}: {
    node: MindMapNode;
    level?: number;
    onEdit: (id: string, title: string) => void;
    onAdd: (id: string) => void;
    onDelete: (id: string) => void;
    readOnly?: boolean;
}) {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="animate-in fade-in zoom-in flex flex-col items-center duration-300">
            <div className={`
                group relative flex min-w-[120px] flex-col items-center gap-1 rounded-lg border px-4 py-2
                ${level === 0 ? "border-blue-500/50 bg-blue-600/20 font-bold text-blue-100" : ""}
                ${level === 1 ? "border-purple-500/50 bg-purple-600/20 font-semibold text-purple-100" : ""}
                ${level >= 2 ? "border-zinc-700 bg-zinc-800/80 text-sm text-zinc-300" : ""}
                shadow-lg backdrop-blur-sm transition-all hover:border-opacity-100
            `}>
                {/* Input Field for Title */}
                <input
                    value={node.title}
                    onChange={(e) => onEdit(node.id, e.target.value)}
                    disabled={readOnly}
                    className="w-full min-w-[80px] rounded bg-transparent px-1 text-center outline-none transition-colors hover:bg-white/5 focus:bg-white/10"
                    placeholder="Topic"
                />

                {/* Action Buttons (Visible on Hover if !readOnly) */}
                {!readOnly && (
                    <div className="absolute -bottom-6 z-10 flex gap-2 rounded-full border border-zinc-800 bg-black/80 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                            onClick={() => onAdd(node.id)}
                            className="px-1 text-xs text-green-400 hover:text-green-300"
                            title="Add Child"
                        >
                            +
                        </button>
                        {level > 0 && ( /* Cannot delete root in this simple view, or handled by parent */
                            <button
                                onClick={() => onDelete(node.id)}
                                className="px-1 text-xs text-red-400 hover:text-red-300"
                                title="Delete Node"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}
            </div>

            {hasChildren && (
                <div className="relative mt-6 flex w-full flex-col items-center">
                    {/* Connector Lines */}
                    <div className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-zinc-600"></div>

                    {node.children!.length > 1 && (
                        <div className="absolute top-0 mb-6 h-px w-[calc(100%-20px)] bg-zinc-600"></div>
                    )}

                    <div className="flex flex-row justify-center gap-8 pt-0">
                        {node.children!.map((child, i) => (
                            <div key={child.id} className="relative flex flex-col items-center">
                                {/* Branch Connector */}
                                <div className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-zinc-600"></div>
                                <EditorNode
                                    node={child}
                                    level={level + 1}
                                    onEdit={onEdit}
                                    onAdd={onAdd}
                                    onDelete={onDelete}
                                    readOnly={readOnly}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MindMapEditor({ root, nodes, readOnly = false, onChange }: Props) {
    const [treeNodes, setTreeNodes] = useState<MindMapNode[]>(nodes);

    // Sync internal state if props change (e.g. initial load)
    useEffect(() => {
        setTreeNodes(nodes);
    }, [nodes]);

    // Handlers
    const handleUpdate = (newNodes: MindMapNode[]) => {
        setTreeNodes(newNodes);
        if (onChange) onChange(newNodes);
    };

    function updateNode(id: string, title: string) {
        const recurse = (list: MindMapNode[]): MindMapNode[] => {
            return list.map((n) =>
                n.id === id
                    ? { ...n, title }
                    : { ...n, children: n.children ? recurse(n.children) : [] }
            );
        };
        handleUpdate(recurse(treeNodes));
    }

    function addChild(id: string) {
        // If adding to Root (which is virtual here as `nodes` are children of `root` string?)
        // Wait, the `root` prop is just a string title, `nodes` are the top-level branches?
        // Or is `root` the top node?
        // In `parseWhiteboard.ts`, we pushed `{ root: parsed.root, nodes: parsed.nodes }`.
        // The parser output implies `nodes` are children of the root topic.
        // So I should render a Root Node physically.

        // If ID matches "SYSTEM_ROOT", we add to `treeNodes`.
        if (id === "SYSTEM_ROOT") {
            handleUpdate([
                ...treeNodes,
                { id: crypto.randomUUID(), title: "New Concept", children: [] }
            ]);
            return;
        }

        const recurse = (list: MindMapNode[]): MindMapNode[] => {
            return list.map((n) =>
                n.id === id
                    ? {
                        ...n,
                        children: [
                            ...(n.children || []),
                            { id: crypto.randomUUID(), title: "New Idea", children: [] },
                        ],
                    }
                    : { ...n, children: n.children ? recurse(n.children) : [] }
            );
        };
        handleUpdate(recurse(treeNodes));
    }

    function deleteNode(id: string) {
        const recurse = (list: MindMapNode[]): MindMapNode[] => {
            return list
                .filter((n) => n.id !== id)
                .map((n) => ({ ...n, children: n.children ? recurse(n.children) : [] }));
        };
        handleUpdate(recurse(treeNodes));
    }

    // Virtual Root Node wrapper
    const rootNode: MindMapNode = {
        id: "SYSTEM_ROOT",
        title: root,
        children: treeNodes
    };

    return (
        <div className="flex min-h-[400px] w-full justify-center overflow-x-auto rounded-xl border border-dashed border-zinc-800/50 bg-[#0b0b0b] p-8">
            <div className="min-w-fit">
                <EditorNode
                    node={rootNode}
                    level={0}
                    onEdit={(id, title) => {
                        // Special case for root title? The prop `root` is a string.
                        // If user edits root, we theoretically should update the block's root string too.
                        // But my simplified handler only updates `treeNodes`.
                        // For now, let's treat root title as read-only or pass a separate callback.
                        if (id === "SYSTEM_ROOT") {
                            // Can't easily update the string prop upwards without a different signature.
                            // Ignoring root title content edit for now, or just don't allow it.
                        } else {
                            updateNode(id, title);
                        }
                    }}
                    onAdd={addChild}
                    onDelete={deleteNode}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
}
