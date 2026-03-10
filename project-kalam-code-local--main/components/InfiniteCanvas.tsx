"use client";

import React, { useRef, useState, useEffect } from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";

type Props = {
    children: React.ReactNode;
    initialScale?: number;
    minScale?: number;
    maxScale?: number;
    className?: string;
};

export default function InfiniteCanvas({
    children,
    initialScale = 1.0,
    minScale = 0.1,
    maxScale = 5.0,
    className = ""
}: Props) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const transformRef = useRef<HTMLDivElement>(null);

    // 🧠 CENTRALIZED WORLD TRANSFORM STATE
    // Everything visual (cards, lines) lives in this coordinate space.
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(initialScale);
    const isPanning = useRef(false);
    const last = useRef({ x: 0, y: 0 });

    // 🖱 POINTER HANDLERS (Viewport Level)
    const handlePointerDown = (e: React.PointerEvent) => {
        // 🛑 PREVENT PANNING ON INTERACTIVE ELEMENTS
        // If the user clicks a card, button, or input inside the canvas, 
        // we must NOT start panning. We only pan if clicking the "background".

        // Check if target is explicitly the viewport or the grid/transform layer
        const target = e.target as HTMLElement;
        const isBackdrop =
            target === viewportRef.current ||
            target.classList.contains("whiteboard-transform") ||
            target.classList.contains("whiteboard-grid");

        if (!isBackdrop) return;

        e.preventDefault();
        isPanning.current = true;
        last.current = { x: e.clientX, y: e.clientY };

        // Capture pointer to ensure smooth drag even if mouse leaves window
        target.setPointerCapture(e.pointerId);
        document.body.style.cursor = "grabbing";
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPanning.current) return;
        e.preventDefault();

        // 🧠 DELTA CALCULATION
        // We move the PAN in pixel space 1:1 with mouse movement
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;

        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        last.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isPanning.current) {
            isPanning.current = false;
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            document.body.style.cursor = "";
        }
    };

    // 🎯 ZOOM LOGIC (Wheel)
    const handleWheel = (e: React.WheelEvent) => {
        // Prevent browser zoom if Ctrl is held
        if (e.ctrlKey) e.preventDefault();

        const rect = viewportRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 1. Calculate Mouse Position relative to Viewport
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 2. Calculate "World Point" under the mouse BEFORE zoom
        // (Where in the infinite canvas are we pointing?)
        const worldX = (mouseX - pan.x) / zoom;
        const worldY = (mouseY - pan.y) / zoom;

        // 3. Calculate New Zoom
        const zoomIntensity = 0.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        const factor = Math.exp(direction * zoomIntensity);
        const newZoom = Math.min(Math.max(zoom * factor, minScale), maxScale);

        // 4. Calculate New Pan to keep "World Point" fixed under "Mouse Point"
        // newPan = mouse - (world * newZoom)
        const newPanX = mouseX - worldX * newZoom;
        const newPanY = mouseY - worldY * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
    };

    return (
        <div
            ref={viewportRef}
            className={`whiteboard-viewport bg-[#1a1a1a] touch-none select-none ${className}`}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                cursor: "grab"
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
        >
            {/* 🌍 TRANSFORM LAYER (The World) */}
            <div
                ref={transformRef}
                className="whiteboard-transform"
                style={{
                    position: 'absolute',
                    inset: 0,
                    // 🧠 CRITICAL: Apply World Transform Here
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "0 0", // Always transform from top-left logic
                    willChange: "transform"
                }}
            >
                {/* 1. GRID BACKGROUND */}
                {/* We scale the grid manually or use background-size. 
                    Since this div is scaled, a fixed background size will appear scaled. 
                    Which is what we want for a "zooming into paper" effect.
                    We use a HUGE size to simulate infinity. */}
                <div
                    className="whiteboard-grid absolute pointer-events-none"
                    style={{
                        width: '200000px',
                        height: '200000px',
                        left: '-100000px',
                        top: '-100000px',
                        backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)',
                        backgroundSize: '40px 40px', // Base grid size
                        opacity: 0.3
                    }}
                />

                {/* 2. WORLD CONTENT (Child Blocks) */}
                <div
                    className="relative pointer-events-auto"
                // We can offset the content origin if needed, but (0,0) is fine
                >
                    {children}
                </div>
            </div>

            {/* 🎮 CONTROLS (Screen Space - Overlay) */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-auto">
                <div className="flex flex-col gap-2 bg-[#1e1e1e]/90 backdrop-blur-md border border-white/10 rounded-full p-2 shadow-2xl">
                    <button
                        onClick={() => setZoom(z => Math.min(z * 1.2, maxScale))}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        title="Zoom In"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setZoom(z => Math.max(z / 1.2, minScale))}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        title="Zoom Out"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <div className="w-full h-px bg-white/10 my-0.5" />
                    <button
                        onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        title="Reset View"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Debug Info (Optional - remove for prod) */}
                    {/* <div className="text-[9px] text-center text-gray-500 font-mono mt-1">
                        {Math.round(zoom * 100)}%
                    </div> */}
                </div>
            </div>
        </div>
    );
}
