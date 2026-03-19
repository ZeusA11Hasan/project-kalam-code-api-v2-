"use client"

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProgress, LEVELS } from "@/lib/levelStore";

export default function DebugOverlay() {
    const [isOpen, setIsOpen] = useState(false);
    const [progress, setProgress] = useState(getProgress());

    // Toggleable debug mode flag
    const debugMode = true;

    useEffect(() => {
        const handleProgressUpdate = (e: any) => {
            setProgress(e.detail);
        };
        window.addEventListener("xpAdded", handleProgressUpdate);
        return () => window.removeEventListener("xpAdded", handleProgressUpdate);
    }, []);

    if (!debugMode) return null;

    return (
        <>
            {/* Floating Debug Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] rounded-lg border-2 border-orange-500/50 bg-[#070B18]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-500 shadow-xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
            >
                DEBUG
            </button>

            {/* Debug Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-6 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="relative w-full max-w-[600px] overflow-hidden rounded-2xl border-2 border-red-500/40 bg-[#070B18] shadow-2xl"
                        >
                            {/* Header / Close button */}
                            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-red-400">
                                    COMPONENT DEBUG MODE • PREVIEW
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="space-y-12 p-8">
                                {/* Section 1: Level Header (Top Center Style) */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-medium uppercase tracking-widest text-white/30">Header Style Preview (Top-Center HUD)</h4>
                                    <div className="flex items-center justify-center rounded-xl border border-white/5 bg-[#03060F] p-8 shadow-inner">
                                        <div className="flex items-center gap-6">
                                            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/20" />
                                            <span className="text-[16px] font-black uppercase tracking-[0.3em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                                LEVEL {progress.currentLevel}
                                            </span>
                                            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/20" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Level Details Row (Bottom Bar / HUD Snippets) */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-medium uppercase tracking-widest text-white/30">Details Row Preview (HUD-Bottom)</h4>
                                    <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#03060F] p-6 shadow-inner">
                                        <div className="pointer-events-none flex h-[50px] w-full items-center justify-between rounded-lg border border-white/5 bg-[#03060F] px-6">
                                            {/* Left — XP Display */}
                                            <div className="flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="#FACC15">
                                                    <path d="M8.5 0L1.5 8H6V14L12.5 5H8L8.5 0Z" />
                                                </svg>
                                                <span className="font-mono text-sm font-bold tracking-tighter text-[#FACC15]">
                                                    {progress.totalXp.toLocaleString()} <span className="text-[10px] opacity-60">XP</span>
                                                </span>
                                            </div>

                                            {/* Center — Level ID */}
                                            <div className="text-[13px] font-bold uppercase tracking-wider text-white/80">
                                                LEVEL {progress.currentLevel}
                                            </div>

                                            {/* Right — Streak with Star Shape */}
                                            <div className="flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="#FACC15">
                                                    <path d="M7 0L8.5 4.5H13.5L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L0.5 4.5H5.5L7 0Z" />
                                                </svg>
                                                <span className="font-mono text-sm font-bold text-white/90">
                                                    {progress.streak}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-center text-[9px] italic text-white/20">Matches Image 2 reference layout and functionality.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Footer */}
                            <div className="flex items-center justify-between bg-red-500/10 px-4 py-3">
                                <span className="text-[8px] font-bold uppercase tracking-tighter text-red-400">
                                    Dev Mode: Active • Persistence: LocalStorage
                                </span>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("toggleGamification"))}
                                    className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-[9px] font-bold text-red-400 transition-all hover:bg-red-500/20 active:scale-95"
                                >
                                    TOGGLE MAIN UI ELEMENTS
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
