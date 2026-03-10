import React from "react";
import { Monitor, LineChart, Video, HelpCircle, Upload, Mic } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
    { id: "whiteboard", label: "Whiteboard", icon: Monitor },
    { id: "graph", label: "Graph", icon: LineChart },
    { id: "live_teach", label: "Live Teach", icon: Video },
    { id: "voice_mode", label: "Voice Mode", icon: Mic },
    { id: "quiz", label: "Quiz Mode", icon: HelpCircle },
    { id: "upload", label: "Upload Notes", icon: Upload },
];

interface FeatureQuickActionsProps {
    voiceMode?: boolean;
    onToggleVoiceMode?: () => void;
    onActionSelect?: (actionId: string) => void;
}

export function FeatureQuickActions({ voiceMode, onToggleVoiceMode, onActionSelect }: FeatureQuickActionsProps) {
    const handleActionClick = (actionId: string) => {
        if (actionId === "voice_mode" && onToggleVoiceMode) {
            onToggleVoiceMode();
        } else if (onActionSelect) {
            onActionSelect(actionId);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
            {actions.map((action) => {
                const isActive = action.id === "voice_mode" && voiceMode;
                return (
                    <button
                        key={action.id}
                        onClick={() => handleActionClick(action.id)}
                        className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${isActive
                            ? "border-[#99C3C4] bg-[#99C3C4]/20 text-[#99C3C4]"
                            : "border-white/5 bg-white/5 text-white/70 hover:border-white/10 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        <action.icon
                            className={`size-4 transition-colors${isActive ? "text-[#99C3C4]" : "text-white/50 group-hover:text-white"
                                }`}
                        />
                        <span>{action.label}</span>
                        {isActive && (
                            <span className="relative ml-1 flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#99C3C4] opacity-75"></span>
                                <span className="relative inline-flex size-2 rounded-full bg-[#99C3C4]"></span>
                            </span>
                        )}
                    </button>
                );
            })}
        </motion.div>
    );
}
