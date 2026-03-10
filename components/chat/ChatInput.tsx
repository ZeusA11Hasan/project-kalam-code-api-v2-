"use client"

import { useState, KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { Paperclip, Sparkles, Mic, Volume2 } from "lucide-react"
import { InteractiveHoverButton } from "../ui/interactive-hover-button"
import { FeatureQuickActions } from "../FeatureQuickActions"
import { SendButton } from "./SendButton"
import { VoiceInputButton } from "../ui/VoiceInputButton"

interface ChatInputProps {
  onSendMessage?: (message: string) => void
  onPlusClick?: () => void
  onAttach?: () => void
  onVoice?: () => void
  onModeSelect?: (mode: string) => void
  disabled?: boolean
  placeholder?: string
  // Voice Mode Props
  voiceMode?: boolean
  onToggleVoiceMode?: () => void
  isSpeaking?: boolean
  onStop?: () => void
}

export function ChatInput({
  onSendMessage,
  onPlusClick,
  onAttach,
  onVoice,
  onModeSelect,
  disabled = false,
  placeholder = "Ask anything...",
  voiceMode = false,
  onToggleVoiceMode,
  isSpeaking = false
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [isModeOpen, setIsModeOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleSend = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleModeSelect = (mode: string) => {
    if (onModeSelect) {
      onModeSelect(mode)
    }
    setIsModeOpen(false)
  }

  return (
    <div className="relative mx-auto mt-48 flex w-full flex-col items-center md:mt-32">
      {/* Global Status - Optional but Recommended */}
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute inset-x-0 -top-12 mx-auto flex w-fit items-center gap-2 rounded-full border border-[#99C3C4]/20 bg-black/60 px-4 py-1 text-xs font-medium text-[#99C3C4] backdrop-blur-md"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#99C3C4] opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-[#99C3C4]"></span>
          </span>
          Tutor is speaking...
        </motion.div>
      )}

      {/* Main Chat Input */}

      {/* Premium Chat Input Container */}
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 60px rgba(153, 195, 196, 0.2), 0 20px 60px rgba(0,0,0,0.4)"
            : "0 10px 50px rgba(0,0,0,0.5)"
        }}
        transition={{ duration: 0.3 }}
        className="chat-box relative flex w-full max-w-full flex-col overflow-hidden rounded-[48px] shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      >
        {/* Gradient Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/50" />

        {/* Large Textarea Area */}
        <div className="relative z-10 px-8 pb-4 pt-8">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            className="h-[200px] w-full resize-none bg-transparent text-lg leading-relaxed text-white/90 outline-none placeholder:text-white/40"
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/5 px-6 py-5">
          {/* Left Actions - Pill Containers */}
          <div className="flex items-center gap-4">
            {/* Attach Button */}
            <motion.button
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(255,255,255,0.15)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={onAttach}
              className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white/60 shadow-sm transition-all hover:text-white"
            >
              <Paperclip className="size-5" />
            </motion.button>

            {/* Mode Button with Neon Glow Animation & Feedback */}
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 25px rgba(153, 195, 196, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                rotate: isModeOpen ? 180 : 0,
                backgroundColor: isModeOpen
                  ? "#99C3C4"
                  : voiceMode
                    ? "rgba(153, 195, 196, 0.15)"
                    : "rgba(255,255,255,0.1)",
                borderColor: voiceMode ? "#99C3C4" : "rgba(0,0,0,0)",
                boxShadow:
                  isModeOpen || (voiceMode && isSpeaking)
                    ? "0 0 25px rgba(153, 195, 196, 0.6), 0 0 50px rgba(153, 195, 196, 0.3)"
                    : "0 0 0px rgba(153, 195, 196, 0)"
              }}
              style={{
                border: voiceMode
                  ? "1px solid rgba(153, 195, 196, 0.3)"
                  : "none"
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              onClick={() => setIsModeOpen(!isModeOpen)}
              className="relative flex size-11 items-center justify-center rounded-full shadow-sm transition-colors"
            >
              {/* Icon Logic */}
              {voiceMode ? (
                isSpeaking ? (
                  <Volume2 className="size-5 animate-pulse text-[#99C3C4]" />
                ) : (
                  <Mic className="size-5 text-[#99C3C4]" />
                )
              ) : (
                <Sparkles
                  className={`size-5 ${isModeOpen ? "text-white" : "text-white/60"}`}
                />
              )}

              {/* Tiny indicator dot if Voice Mode is on but menu is closed */}
              {!isModeOpen && voiceMode && (
                <span className="absolute right-0 top-0 flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#99C3C4] opacity-75"></span>
                  <span className="relative inline-flex size-3 rounded-full bg-[#99C3C4]"></span>
                </span>
              )}
            </motion.button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Voice Input Button - STT integrated */}
            <VoiceInputButton
              onInterim={text => {
                // Update input with live transcript (appends to existing)
                setInput(text)
              }}
              onFinal={text => {
                // Set final transcript
                setInput(text)
              }}
              getCurrentInput={() => input}
              size="md"
            />

            {/* Premium Send Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <SendButton
                onClick={handleSend}
                disabled={disabled || !input.trim()}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Feature Quick Actions - Appears only when Mode is open */}
      {isModeOpen && (
        <FeatureQuickActions
          voiceMode={voiceMode}
          onToggleVoiceMode={onToggleVoiceMode}
          onActionSelect={handleModeSelect}
        />
      )}
    </div>
  )
}
