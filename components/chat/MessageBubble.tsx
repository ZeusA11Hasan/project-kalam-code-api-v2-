"use client"

import { MathChemRenderer } from "./MathRenderer"
import { Volume2 } from "lucide-react"
import { motion } from "framer-motion"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp?: Date
}

interface MessageBubbleProps {
  message: Message
  isSpeaking?: boolean
}

export function MessageBubble({
  message,
  isSpeaking = false
}: MessageBubbleProps) {
  const isUser = message.role === "user"

  // Only animate if it's an assistant message and currently speaking this message
  const shouldAnimate = !isUser && isSpeaking

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`relative max-w-[80%] rounded-2xl px-4 py-3 transition-all duration-300 ${
          isUser ? "bg-white/15 text-white" : "bg-white/8 text-white/90"
        } ${shouldAnimate ? "ring-0" : ""}`}
      >
        {/* Premium Animated Border (Pseudo-element simulation) */}
        {shouldAnimate && (
          <div className="animate-gradient-border absolute inset-0 -z-10 -m-[2px] rounded-[18px] bg-gradient-to-r from-[#99C3C4] via-[#A57BFF] to-[#99C3C4] opacity-80 blur-[2px]"></div>
        )}

        {/* Speaking Indicator Icon */}
        {shouldAnimate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -right-3 -top-3 z-10 flex size-6 items-center justify-center rounded-full bg-[#99C3C4] text-black shadow-lg"
          >
            <Volume2 className="size-3 animate-pulse" />
          </motion.div>
        )}

        {/* Content with subtle pulse if speaking */}
        <motion.div
          animate={
            shouldAnimate ? { opacity: [0.95, 1, 0.95] } : { opacity: 1 }
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <MathChemRenderer text={message.content} />
        </motion.div>
      </div>

      {/* Styles for the animation */}
      <style jsx>{`
        @keyframes gradient-border {
          0% {
            background-position: 0% 50%;
            opacity: 0.6;
          }
          50% {
            background-position: 100% 50%;
            opacity: 1;
          }
          100% {
            background-position: 0% 50%;
            opacity: 0.6;
          }
        }
        .animate-gradient-border {
          background-size: 200% 200%;
          animation: gradient-border 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
