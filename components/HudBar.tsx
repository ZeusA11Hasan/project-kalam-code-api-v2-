"use client"

import { useEffect, useState, useRef } from "react";
import { getProgress, LEVELS } from "@/lib/levelStore";
import { cn } from "@/lib/utils";

export default function HudBar() {
    const [progress, setProgress] = useState(getProgress());
    const [displayXp, setDisplayXp] = useState(progress.totalXp);
    const xpRef = useRef(progress.totalXp);

    useEffect(() => {
        const handleProgressUpdate = (e: any) => {
            const newProgress = e.detail;
            setProgress(newProgress);

            // Animate XP number count-up
            const start = xpRef.current;
            const end = newProgress.totalXp;
            const duration = 1000;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progressRatio = Math.min(elapsed / duration, 1);
                const currentVal = Math.floor(start + (end - start) * progressRatio);

                setDisplayXp(currentVal);

                if (progressRatio < 1) {
                    requestAnimationFrame(animate);
                } else {
                    xpRef.current = end;
                }
            };
            requestAnimationFrame(animate);
        };

        window.addEventListener("xpAdded", handleProgressUpdate);
        return () => window.removeEventListener("xpAdded", handleProgressUpdate);
    }, []);

    const currentLevelData = LEVELS.find(l => l.id === progress.currentLevel) || LEVELS[0];
    const totalLevels = LEVELS.length;

    return (
        <div className="flex h-[50px] w-full items-center justify-between border-b border-white/5 bg-[#03060F]/90 px-[18px] backdrop-blur-xl">
            {/* Left — XP Display */}
            <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="#FACC15">
                    <path d="M8.5 0L1.5 8H6V14L12.5 5H8L8.5 0Z" />
                </svg>
                <span className="font-mono text-sm font-bold tracking-tighter text-[#FACC15]">
                    {displayXp.toLocaleString()} <span className="text-[10px] opacity-60">XP</span>
                </span>
            </div>

            {/* Center — Level Indicator */}
            <div className="flex items-center gap-4">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-white">
                    LEVEL {progress.currentLevel}
                </span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* Right — Streak */}
            <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="#FACC15">
                    <path d="M7 0L8.5 4.5H13.5L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L0.5 4.5H5.5L7 0Z" />
                </svg>
                <span className="font-mono text-sm font-bold text-white/90">
                    {progress.streak}
                </span>
            </div>
        </div>
    );
}
