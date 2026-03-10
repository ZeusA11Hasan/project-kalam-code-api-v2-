"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUp,
    Paperclip,
    Square,
    X,
    Mic,
    MicOff,
    Globe,
    BrainCog,
    Sparkles,
    Search,
    StopCircle,
    Layout,
    Volume2
} from "lucide-react";
import { CallWaveform } from "./CallWaveform";

// --- Utility ---
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// --- Sub-components ---

/**
 * Tooltip wrapper for actions
 */
const ActionTooltip = ({ children, label }: { children: React.ReactNode; label: string }) => (
    <div className="group relative whitespace-nowrap">
        {children}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {label}
        </div>
    </div>
);

// --- Main Component ---

interface PromptInputBoxProps {
    onSend?: (message: string, files?: File[]) => void;
    onStop?: () => void;
    onStartCall?: () => void;
    onMicToggle?: () => void;
    isCallActive?: boolean;
    isListening?: boolean;
    isSpeaking?: boolean;
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
    interimTranscript?: string;
}

export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>((props, ref) => {
    const {
        onSend = () => { },
        onStop,
        onStartCall,
        onMicToggle,
        isCallActive = false,
        isListening = false,
        isSpeaking = false,
        isLoading = false,
        placeholder = "Ask me anything...",
        className,
        interimTranscript
    } = props;

    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const handleSend = useCallback(() => {
        if (!input.trim() && files.length === 0) return;
        onSend(input.trim(), files);

        // Reset
        setInput("");
        setFiles([]);
        setPreviews([]);
    }, [input, files, onSend]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validImages = selectedFiles.filter(f => f.type.startsWith('image/'));

        if (validImages.length > 0) {
            setFiles(prev => [...prev, ...validImages]);
            validImages.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => setPreviews(prev => [...prev, e.target?.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Determine what the right button does
    const handleRightButtonClick = () => {
        if (isLoading) {
            onStop?.();
        } else if (input.trim() || files.length > 0) {
            handleSend();
        } else {
            // No text → start the Call Dock Mode
            onStartCall?.();
        }
    };

    return (
        <div ref={ref} className={cn("w-full max-w-3xl mx-auto", className)}>
            <motion.div
                className={cn(
                    "relative flex flex-col rounded-[2.5rem] bg-[rgba(13,13,15,0.92)] border border-white/[0.02] p-2 transition-all duration-500 shadow-[-6px_-6px_14px_rgba(255,255,255,0.02),6px_6px_14px_rgba(0,0,0,0.6)] backdrop-blur-2xl",
                    isListening
                        ? "shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_2px_2px_6px_rgba(0,0,0,0.6)]"
                        : isFocused
                            ? "shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_2px_2px_6px_rgba(0,0,0,0.7)]"
                            : ""
                )}
            >
                {/* 1. File Previews Area */}
                <AnimatePresence>
                    {previews.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-wrap gap-2 px-4 pt-3 pb-1"
                        >
                            {previews.map((src, idx) => (
                                <motion.div
                                    key={idx}
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative group w-16 h-16 rounded-2xl overflow-hidden border border-white/10"
                                >
                                    <img src={src} className="w-full h-full object-cover" alt="preview" />
                                    <button
                                        onClick={() => removeFile(idx)}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        <X size={14} className="text-white" />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2. Main Input Section */}
                <div className="flex items-end gap-2 px-2 py-1">
                    {/* Left Actions */}
                    <div className="flex items-center mb-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        <ActionTooltip label="Attach images">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-white/30 hover:text-white/70 hover:bg-white/5 rounded-full transition-all"
                            >
                                <Paperclip size={20} />
                            </button>
                        </ActionTooltip>
                    </div>

                    {/* TextArea / Voice State */}
                    <div className="flex-1 relative flex flex-col min-h-[44px] justify-center">
                        <AnimatePresence mode="wait">
                            {isCallActive ? (
                                <motion.div
                                    key="call-active"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "size-2 rounded-full animate-pulse",
                                            isSpeaking ? "bg-cyan-400" : "bg-red-500"
                                        )} />
                                        <span className={cn(
                                            "text-[11px] font-black uppercase tracking-widest",
                                            isSpeaking ? "text-cyan-400/80" : "text-red-500/80"
                                        )}>
                                            {isSpeaking ? "AI Speaking" : isListening ? "Listening" : "Mic Muted"}
                                        </span>
                                    </div>
                                    <CallWaveform isMuted={!isListening && !isSpeaking} />
                                </motion.div>
                            ) : (
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={placeholder}
                                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-[15px] font-medium text-white placeholder:text-white/30 py-3 px-1 resize-none overflow-y-auto max-h-[200px] scrollbar-none"
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Actions (Send/Mic/Stop) */}
                    <div className="flex items-center mb-1">
                        <AnimatePresence>
                            {(input.trim() || files.length > 0 || !isCallActive) && (
                                <motion.button
                                    key="right-button"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    layout
                                    onClick={handleRightButtonClick}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "p-2.5 rounded-2xl flex items-center justify-center transition-all duration-500 bg-[rgba(13,13,15,0.92)] backdrop-blur-md focus:outline-none",
                                        isLoading
                                            ? "text-red-500 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(0,0,0,0.6)]"
                                            : isListening
                                                ? "text-red-400 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(0,0,0,0.6)] animate-pulse"
                                                : (input.trim() || files.length > 0)
                                                    ? "text-white shadow-[-3px_-3px_6px_rgba(255,255,255,0.03),3px_3px_6px_rgba(0,0,0,0.6)] hover:shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(0,0,0,0.6)]"
                                                    : "text-white/40 hover:text-white/80 shadow-[-3px_-3px_6px_rgba(255,255,255,0.03),3px_3px_6px_rgba(0,0,0,0.6)] hover:shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(0,0,0,0.6)]"
                                    )}
                                >
                                    {isLoading ? (
                                        <Square size={16} fill="currentColor" />
                                    ) : isListening ? (
                                        <MicOff size={20} />
                                    ) : (input.trim() || files.length > 0) ? (
                                        <ArrowUp size={20} className="stroke-[3]" />
                                    ) : (
                                        <Mic size={20} />
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>


            </motion.div>

            {/* Subtle bottom shadow cast */}
            <div className="mx-auto h-1 w-[80%] bg-white/20 blur-2xl opacity-20 -mt-2 rounded-full pointer-events-none" />
        </div>
    );
});

PromptInputBox.displayName = "PromptInputBox";
