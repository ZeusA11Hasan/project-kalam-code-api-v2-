"use client";

import React, { useRef, useEffect, useState } from 'react';
import WhiteboardBlockRenderer from './WhiteboardBlockRenderer';
import ExportButtons from "./ExportButtons";
import LivePointerOverlay from "./LivePointerOverlay";
import InfiniteCanvas from "./InfiniteCanvas";
import WhiteboardRenderer from "./WhiteboardRenderer";
import { useTeacherPointer } from '@/hooks/useTeacherPointer';
import { motion } from 'framer-motion';
import type { WhiteboardBlock } from "@/types/whiteboardSession";
import type { LivePointer } from "@/types/livePointer";

type Props = {
    blocks: WhiteboardBlock[];
    onSpeak?: (text: string) => void;
    onStopSpeak?: () => void;
    isVoiceMode?: boolean;
};

export default function WhiteboardContainer({ blocks, onSpeak, onStopSpeak, isVoiceMode }: Props) {
    const exportRef = useRef<HTMLDivElement>(null);
    const [pointer, setPointer] = useState<LivePointer | null>(null);

    // Teacher Logic: Capture mouse and "broadcast" (loopback here)
    const { handleMouseMove, handleMouseLeave } = useTeacherPointer((p) => {
        setPointer(p);
    });

    return (
        <div className="relative flex size-full flex-col bg-[#0b0b0b]">
            {/* Export Header */}
            <div className="sticky top-0 z-50 flex w-full justify-end gap-2 border-b border-white/10 bg-[#0b0b0b]/90 p-2 px-4 shadow-sm backdrop-blur-sm">
                <ExportButtons targetRef={exportRef} />
            </div>

            {/* Infinite Canvas Area */}
            <div
                className="relative flex-1 overflow-hidden"
                ref={exportRef} // Capture the canvas for export
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <InfiniteCanvas>
                    {/* LAYER 1: Vector Drawings (from <canvas> blocks) */}
                    {/* These are rendered as individual draggable SVG/Div elements in world space */}
                    <WhiteboardRenderer
                        blocks={blocks}
                        onSpeak={onSpeak}
                        onStopSpeak={onStopSpeak}
                        isVoiceMode={isVoiceMode}
                    />

                    {/* LAYER 2: Content Cards (Notes, LaTeX, Tables, Mindmaps) */}
                    {blocks.map((block, i) => {
                        // Skip 'canvas' type as it is handled by the layer above
                        if (block.type === 'canvas') return null;

                        return (
                            <motion.div
                                key={block.id}
                                // Smart Stacking: Position cards vertically so they don't overlap initially
                                initial={{ x: 100, y: 100 + (i * 200) }}
                                drag
                                dragMomentum={false}
                                className="absolute"
                                style={{ width: 500 }} // Fixed width for cards
                                onPointerDown={(e) => e.stopPropagation()} // Prevent canvas pan when clicking card
                            >
                                <div className="cursor-grab rounded-xl border border-white/10 bg-[#1e1e1e]/90 p-4 text-white shadow-2xl backdrop-blur active:cursor-grabbing">
                                    {/* Header / Drag Handle */}
                                    <div className="mb-2 flex items-center justify-between opacity-50 transition-opacity hover:opacity-100">
                                        <div className="text-[10px] font-bold uppercase tracking-wider">
                                            {block.type}
                                        </div>
                                        <div className="i-lucide-grip-horizontal size-4" />
                                    </div>

                                    {/* Content (Rendered by existing logic) */}
                                    <div className="pointer-events-auto">
                                        <WhiteboardBlockRenderer block={block} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Empty State Hint (World Space) */}
                    {blocks.length === 0 && (
                        <div className="pointer-events-none absolute left-[400px] top-[300px] -translate-x-1/2 text-center text-white/20">
                            <div className="mb-4 text-6xl opacity-20">✨</div>
                            <h3 className="text-xl font-medium">Infinite Whiteboard</h3>
                            <p className="text-sm">Drag to pan • Scroll to zoom</p>
                        </div>
                    )}
                </InfiniteCanvas>

                {/* Live Pointer Overlay (Screen Space) */}
                <div className="pointer-events-none absolute inset-0 z-50">
                    <LivePointerOverlay pointer={pointer} />
                </div>
            </div>
        </div>
    );
}

