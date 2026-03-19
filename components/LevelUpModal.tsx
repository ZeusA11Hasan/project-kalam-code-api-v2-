"use client"

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type LevelData } from "@/lib/levelStore";

interface LevelUpModalProps {
    levelData: LevelData;
    onClose: () => void;
}

export default function LevelUpModal({ levelData, onClose }: LevelUpModalProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);

        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => {
            window.removeEventListener("keydown", handleEsc);
            clearTimeout(timer);
        };
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#03060F]/80 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
        >
            {/* SVG Starburst Background */}
            <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute size-[800px] opacity-[0.03]"
                viewBox="0 0 100 100"
            >
                {[...Array(8)].map((_, i) => (
                    <path
                        key={i}
                        d="M50,50 L100,50 A50,50 0 0,1 93.3,75 Z"
                        fill="#FACC15"
                        transform={`rotate(${i * 45} 50 50)`}
                    />
                ))}
            </motion.svg>

            {/* Modal Card */}
            <motion.div
                initial={{ y: 50, scale: 0.9, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 50, scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="relative w-[320px] overflow-hidden rounded-[24px] border border-[#FACC15]/20 bg-[#070B18] p-8"
            >
                <div className="flex flex-col items-center">
                    {/* Elements fade up with stagger */}
                    <motion.span
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.08 }}
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4F46E5]"
                    >
                        LEVEL COMPLETE
                    </motion.span>

                    <motion.h2
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.16 }}
                        className="mt-2 text-center text-2xl font-bold text-white"
                    >
                        {levelData.name}
                    </motion.h2>

                    {/* Animated gold divider */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.24, duration: 0.5 }}
                        className="mt-4 h-[1px] bg-[#FACC15]/30"
                    />

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.32 }}
                        className="mt-6 flex flex-col items-center"
                    >
                        <span className="font-mono text-3xl font-bold text-[#FACC15]">+50 XP</span>
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.4, duration: 1 }}
                                className="h-full bg-gradient-to-r from-[#4F46E5] to-[#9333EA]"
                            />
                        </div>
                    </motion.div>

                    <motion.button
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.48 }}
                        onClick={onClose}
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-4 text-sm font-medium text-white/70 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
                    >
                        Continue <span className="opacity-40">→</span>
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}
