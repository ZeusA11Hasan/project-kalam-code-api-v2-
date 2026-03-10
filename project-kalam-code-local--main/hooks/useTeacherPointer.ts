import { useCallback, useRef } from "react";
import type { LivePointer } from "@/types/livePointer";

export function useTeacherPointer(sendPointer: (p: LivePointer) => void) {
    const lastSent = useRef(0);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const now = Date.now();
        // Throttle to ~20ms (50fps)
        if (now - lastSent.current < 20) return;

        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();

        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const pointer: LivePointer = {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y)),
            visible: true,
            timestamp: now,
        };

        sendPointer(pointer);
        lastSent.current = now;
    }, [sendPointer]);

    const handleMouseLeave = useCallback(() => {
        sendPointer({ x: 0, y: 0, visible: false, timestamp: Date.now() });
    }, [sendPointer]);

    return { handleMouseMove, handleMouseLeave };
}
