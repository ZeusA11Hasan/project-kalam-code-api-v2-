"use client";

import React from "react";
import { motion } from "framer-motion";

interface CallWaveformProps {
    isMuted?: boolean;
}

export const CallWaveform: React.FC<CallWaveformProps> = ({ isMuted = false }) => {
    return (
        <div className="flex h-12 items-center justify-center gap-[3px]">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={isMuted ? { height: "10%", opacity: 0.2 } : {
                        height: [
                            "20%",
                            `${40 + Math.random() * 60}%`,
                            "20%"
                        ],
                        opacity: [0.4, 1, 0.4]
                    }}
                    transition={isMuted ? { duration: 0.3 } : {
                        duration: 0.8 + Math.random() * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.05
                    }}
                    className="w-[3px] rounded-full bg-white"
                />
            ))}
        </div>
    );
};
