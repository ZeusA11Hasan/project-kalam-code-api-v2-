"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Paperclip, Mic, Send } from "lucide-react"

interface BottomChatInputProps {
    onSend?: (message: string) => void
    onAttach?: () => void
    onVoice?: () => void
    placeholder?: string
}

export function BottomChatInput({
    onSend,
    onAttach,
    onVoice,
    placeholder = "Ask me anything…"
}: BottomChatInputProps) {
    const [input, setInput] = useState("")

    const handleSend = () => {
        if (input.trim() && onSend) {
            onSend(input.trim())
            setInput("")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-4 backdrop-blur-sm"
        >
            <div className="mx-auto max-w-3xl">
                <div className="flex items-center gap-4 rounded-full bg-[#0d0d0f] px-6 py-4 shadow-[-16px_-16px_32px_rgba(255,255,255,0.04),16px_16px_32px_rgba(0,0,0,1),inset_1px_1px_2px_rgba(255,255,255,0.03)] transition-all">
                    {/* Attach Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAttach}
                        className="flex size-12 items-center justify-center rounded-full bg-[#0d0d0f] text-white/40 shadow-[-6px_-6px_15px_rgba(255,255,255,0.05),8px_8px_20px_rgba(0,0,0,1)] transition-all hover:text-white hover:shadow-[inset_-6px_-6px_15px_rgba(255,255,255,0.02),inset_10px_10px_20px_rgba(0,0,0,1)]"
                    >
                        <Paperclip className="size-5" />
                    </motion.button>

                    {/* Input Field */}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/20"
                    />

                    {/* Voice Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onVoice}
                        className="flex size-12 items-center justify-center rounded-full bg-[#0d0d0f] text-white/40 shadow-[-6px_-6px_15px_rgba(255,255,255,0.05),8px_8px_20px_rgba(0,0,0,1)] transition-all hover:text-white hover:shadow-[inset_-6px_-6px_15px_rgba(255,255,255,0.02),inset_10px_10px_20px_rgba(0,0,0,1)]"
                    >
                        <Mic className="size-5" />
                    </motion.button>

                    {/* Send Button */}
                    {input.trim() && (
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            className="flex size-12 items-center justify-center rounded-full bg-[#0d0d0f] text-teal-400 shadow-[-6px_-6px_15px_rgba(255,255,255,0.05),8px_8px_20px_rgba(0,0,0,1)] transition-all hover:shadow-[inset_-6px_-6px_15px_rgba(255,255,255,0.02),inset_10px_10px_20px_rgba(0,0,0,1)]"
                        >
                            <Send className="size-5" />
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
