"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface LiveWaveformProps {
    isActive: boolean;
    isSpeaking?: boolean;
    barCount?: number;
}

export const LiveWaveform: React.FC<LiveWaveformProps> = ({
    isActive,
    isSpeaking = false,
    barCount = 24,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const phasesRef = useRef<number[]>(
        Array.from({ length: barCount }, () => Math.random() * Math.PI * 2)
    );

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const phases = phasesRef.current;
        const now = Date.now() / 1000;
        const gap = 2;
        const barW = Math.max(2, (w - (barCount - 1) * gap) / barCount);

        for (let i = 0; i < barCount; i++) {
            const phase = phases[i];

            let amplitude: number;
            if (!isActive) {
                // Idle — flat bars
                amplitude = 0.08;
            } else if (isSpeaking) {
                // AI speaking — smooth symmetric wave
                amplitude =
                    0.2 +
                    0.35 * Math.sin(now * 2.5 + phase) +
                    0.25 * Math.sin(now * 4.1 + phase * 1.7) +
                    0.1 * Math.sin(now * 7 + phase * 2.3);
            } else {
                // Listening — organic pulsing
                amplitude =
                    0.15 +
                    0.3 * Math.sin(now * 3.2 + phase) +
                    0.2 * Math.sin(now * 5.5 + phase * 1.4) +
                    0.15 * Math.sin(now * 8 + phase * 2.1);
            }

            amplitude = Math.max(0.06, Math.min(1, amplitude));
            const barH = amplitude * h;
            const x = i * (barW + gap);
            const y = (h - barH) / 2;

            // Color
            const gradient = ctx.createLinearGradient(x, y, x, y + barH);
            if (isSpeaking) {
                gradient.addColorStop(0, "rgba(6, 182, 212, 0.9)");   // cyan-400
                gradient.addColorStop(0.5, "rgba(34, 211, 238, 1)");  // cyan-300
                gradient.addColorStop(1, "rgba(6, 182, 212, 0.9)");
            } else if (isActive) {
                gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
                gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
                gradient.addColorStop(1, "rgba(255, 255, 255, 0.4)");
            } else {
                gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
                gradient.addColorStop(1, "rgba(255, 255, 255, 0.15)");
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, barW / 2);
            ctx.fill();
        }

        animRef.current = requestAnimationFrame(draw);
    }, [isActive, isSpeaking, barCount]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
        >
            <canvas
                ref={canvasRef}
                className="w-20 h-10"
                style={{ imageRendering: "auto" }}
            />
            {/* Glow behind waveform in speaking mode */}
            {isSpeaking && (
                <div
                    className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)" }}
                />
            )}
        </motion.div>
    );
};
