"use client"

import React from "react"
import { motion } from "framer-motion"

interface FlipButtonProps {
  text1: string
  text2: string
  icon1?: React.ReactNode
  icon2?: React.ReactNode
  isFlipped: boolean
  onClick: () => void
  className?: string
}

export function FlipButton({
  text1,
  text2,
  icon1,
  icon2,
  isFlipped,
  onClick,
  className
}: FlipButtonProps) {
  return (
    <div
      className={`group relative h-[36px] w-[150px] shrink-0 cursor-pointer ${className || ""}`}
      style={{ perspective: "1000px" }}
      onClick={onClick}
    >
      <motion.div
        className="relative size-full"
        animate={{ rotateX: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side (text1 - PYTHON) */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 rounded-full border border-white/5 bg-[#0d0d0f] text-white/90 shadow-[-6px_-6px_15px_rgba(255,255,255,0.02),8px_8px_20px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        >
          {icon1}
          <span className="select-none whitespace-nowrap text-[10px] font-black uppercase tracking-[3px]">
            {text1}
          </span>
        </div>

        {/* Back Side (text2 - SQL) */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 rounded-full border border-white/5 bg-[#0d0d0f] text-white shadow-[-6px_-6px_15px_rgba(255,255,255,0.02),8px_8px_20px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateX(180deg)"
          }}
        >
          {icon2}
          <span className="select-none whitespace-nowrap text-[10px] font-black uppercase tracking-[3px]">
            {text2}
          </span>
        </div>
      </motion.div>

      {/* Subtle Reflection Sheen */}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  )
}
