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
        <div className="relative w-full h-full flex flex-col bg-[#0b0b0b]">
            {/* Export Header */}
            <div className="sticky top-0 z-50 w-full bg-[#0b0b0b]/90 backdrop-blur-sm border-b border-white/10 p-2 flex justify-end gap-2 px-4 shadow-sm">
                <ExportButtons targetRef={exportRef} />
            </div>

            {/* Infinite Canvas Area */}
            <div
                className="flex-1 overflow-hidden relative"
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
                                <div className="bg-[#1e1e1e]/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-2xl cursor-grab active:cursor-grabbing text-white">
                                    {/* Header / Drag Handle */}
                                    <div className="flex justify-between items-center mb-2 opacity-50 hover:opacity-100 transition-opacity">
                                        <div className="text-[10px] uppercase tracking-wider font-bold">
                                            {block.type}
                                        </div>
                                        <div className="i-lucide-grip-horizontal w-4 h-4" />
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
                        <div className="absolute top-[300px] left-[400px] -translate-x-1/2 text-white/20 text-center pointer-events-none">
                            <div className="text-6xl mb-4 opacity-20">✨</div>
                            <h3 className="text-xl font-medium">Infinite Whiteboard</h3>
                            <p className="text-sm">Drag to pan • Scroll to zoom</p>
                        </div>
                    )}
                </InfiniteCanvas>

                {/* Live Pointer Overlay (Screen Space) */}
                <div className="absolute inset-0 pointer-events-none z-50">
                    <LivePointerOverlay pointer={pointer} />
                </div>
            </div>
        </div>
    );
}

