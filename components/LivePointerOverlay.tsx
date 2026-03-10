"use client";

import { useEffect, useState } from "react";
import type { LivePointer } from "@/types/livePointer";

type Props = {
    pointer: LivePointer | null;
};

export default function LivePointerOverlay({ pointer }: Props) {
    const [isVisible, setIsVisible] = useState(false);

    // Auto-hide logic
    useEffect(() => {
        if (!pointer || !pointer.visible) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);
        const timeout = setTimeout(() => {
            setIsVisible(false);
        }, 1500); // Hide after 1.5s of inactivity timestamp check? 
        // Actually, if parent updates pointer, this effect re-runs.
        // So seeing a new timestamp keeps it visible.

        return () => clearTimeout(timeout);
    }, [pointer]); // Dependencies: pointer object ref (changes on update)

    if (!isVisible || !pointer) return null;

    return (
        <div
            className="pointer-overlay transition-transform duration-75 ease-out"
            style={{
                position: "absolute",
                left: `${pointer.x * 100}%`,
                top: `${pointer.y * 100}%`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 60, // Above content, below max overlays
            }}
        >
            {/* Main Laser Dot */}
            <div className="relative">
                <div className="absolute left-0 top-0 size-4 animate-ping rounded-full bg-cyan-400 opacity-70" />
                <div className="relative z-10 size-3 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                {/* Optional "Teacher" Label */}
                <span className="absolute left-4 top-0 ml-1 whitespace-nowrap rounded border border-cyan-500/20 bg-black/60 px-1 text-[10px] text-cyan-200 backdrop-blur-sm">
                    Teacher
                </span>
            </div>
        </div>
    );
}
