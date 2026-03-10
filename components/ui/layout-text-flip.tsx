"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export const LayoutTextFlip = ({
  text = "Build Amazing",
  words = ["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"],
  duration = 3000
}: {
  text: string
  words: string[]
  duration?: number
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [words.length, duration])

  return (
    <>
      <motion.span
        layoutId="subtext"
        className="text-4xl font-bold tracking-tight text-white drop-shadow-lg md:text-6xl"
      >
        {text}
      </motion.span>
      <motion.span
        layout
        className="relative inline-flex items-center justify-center rounded-lg border border-white/20 bg-black/40 px-6 py-3 font-sans text-4xl font-bold tracking-tight shadow-[0_4px_20px_rgba(153,195,196,0.3)] drop-shadow-lg backdrop-blur-xl md:text-6xl"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -20, filter: "blur(4px)", opacity: 0 }}
            animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
            exit={{ y: 20, filter: "blur(4px)", opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
              "inline-block whitespace-nowrap bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text pr-2 text-transparent"
            )}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  )
}
