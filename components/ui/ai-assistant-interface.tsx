"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Sparkles, Zap, MessageSquare } from "lucide-react"
import { PromptInputBox } from "./ai-prompt-box"

interface AIAssistantInterfaceProps {
  onSendMessage?: (message: string) => void
  onStartCall?: () => void
  isCallActive?: boolean
  isLoading?: boolean
}

export function AIAssistantInterface({
  onSendMessage,
  onStartCall,
  isCallActive = false,
  isLoading = false
}: AIAssistantInterfaceProps) {
  const [greeting, setGreeting] = useState("Good Morning")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
      {/* Header section to make it feel like a persona again */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
            <Cpu className="size-6 text-white" />
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
          {greeting},{" "}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Max
          </span>
        </h1>
        <p className="text-sm font-medium text-white/40">
          I&apos;m your AI tutor. How can I help you today?
        </p>
      </motion.div>

      {/* The Main Chat Input - Premium Recoded Version */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full px-4"
      >
        <PromptInputBox
          onSend={onSendMessage}
          onStartCall={onStartCall}
          isCallActive={isCallActive}
          isLoading={isLoading}
          placeholder="E.g. Explain quantum entanglement..."
          className="!max-w-none shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)]"
        />
      </motion.div>

      {/* Suggestion Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex flex-wrap justify-center gap-2"
      >
        {[
          { icon: Sparkles, label: "Quantum Physics" },
          { icon: Zap, label: "React Patterns" },
          { icon: MessageSquare, label: "Grammar Check" }
        ].map((item, idx) => (
          <button
            key={idx}
            className="rounded-full border border-white/5 bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/30 transition-all hover:bg-white/5 hover:text-white/60"
          >
            {item.label}
          </button>
        ))}
      </motion.div>
    </div>
  )
}
