"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, Users, Square } from "lucide-react";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

interface CallDockProps {
    isActive: boolean;
    onEndCall: () => void;
    isListening?: boolean;
    onToggleMic?: () => void;
    isLoading?: boolean;
    isSpeaking?: boolean;
    onStop?: () => void;
}

export const CallDock: React.FC<CallDockProps> = ({ isActive, onEndCall, isListening, onToggleMic, isLoading, isSpeaking, onStop }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    // Dock height is ~80px. Half-hidden = pushed down 45px.
    // When revealed = pulled up with 12px gap from bottom.
    const hiddenY = 60;
    const revealedY = -12;

    // Detect mouse near bottom edge of screen
    const handleMouseMove = useCallback((e: MouseEvent) => {
        const screenH = window.innerHeight;
        const triggerZone = 120; // px from bottom edge to trigger reveal

        if (e.clientY > screenH - triggerZone) {
            setIsRevealed(true);
        } else {
            setIsRevealed(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [handleMouseMove]);

    return (
        <div className="fixed inset-x-0 bottom-0 flex items-end justify-center z-[9999] pointer-events-none">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{
                    y: isRevealed ? revealedY : hiddenY,
                    opacity: 1,
                }}
                exit={{ y: 100, opacity: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                }}
                className="pointer-events-auto relative flex items-center gap-6 px-8 py-4 mb-3 rounded-[40px] bg-[#0d0d0f] shadow-[-12px_-12px_30px_rgba(255,255,255,0.02),15px_15px_35px_rgba(0,0,0,1)]"
                onMouseEnter={() => setIsRevealed(true)}
                onMouseLeave={() => setIsRevealed(false)}
            >
                {/* Left Action: Mic Control */}
                <div className="flex flex-col items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onToggleMic?.()}
                        className={cn(
                            "flex items-center justify-center size-12 rounded-full transition-all duration-300",
                            isListening
                                ? "text-white bg-transparent shadow-none"
                                : "text-red-500 bg-[#0d0d0f] shadow-[-6px_-6px_15px_rgba(255,255,255,0.05),8px_8px_20px_rgba(0,0,0,1)]"
                        )}
                    >
                        {isListening ? <Mic size={20} strokeWidth={2.5} /> : <MicOff size={20} strokeWidth={2.5} />}
                    </motion.button>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", isListening ? "text-white/20" : "text-red-500/80")}>
                        {isListening ? "Mic On" : "Muted"}
                    </span>
                </div>

                {/* Question Discontinue (Stop) Action */}
                <AnimatePresence>
                    {(isLoading || isSpeaking) && (
                        <motion.div
                            initial={{ scale: 0, width: 0, opacity: 0 }}
                            animate={{ scale: 1, width: "auto", opacity: 1 }}
                            exit={{ scale: 0, width: 0, opacity: 0 }}
                            className="flex flex-col items-center gap-1"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onStop?.()}
                                className="flex items-center justify-center size-12 rounded-full bg-[#0d0d0f] shadow-[-6px_-6px_15px_rgba(255,255,255,0.04),8px_8px_20px_rgba(0,0,0,1)] text-red-500"
                            >
                                <Square size={18} fill="currentColor" />
                            </motion.button>
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500/60">
                                {isSpeaking ? "Speaking" : "Stop"}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Center Action: End Call */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onEndCall}
                    className="flex items-center justify-center w-20 h-12 rounded-[24px] bg-[#FF3B30] text-white shadow-[0_8px_25px_-5px_rgba(255,59,48,0.5)] relative group"
                >
                    <div className="absolute inset-0 rounded-[24px] bg-[#FF3B30] blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                    <Phone size={24} fill="currentColor" className="relative rotate-[135deg]" />
                </motion.button>

                {/* Right Action: Users */}
                <div className="flex flex-col items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center size-12 rounded-full bg-[#0d0d0f] shadow-[-6px_-6px_15px_rgba(255,255,255,0.03),8px_8px_15px_rgba(0,0,0,1)] text-white/40 hover:text-white transition-all"
                    >
                        <Users size={20} strokeWidth={2.5} />
                    </motion.button>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Call</span>
                </div>

                {/* Visual Accent Border */}
                <div className="absolute inset-0 rounded-[40px] border border-white/5 pointer-events-none" />
            </motion.div>
        </div>
    );
};
