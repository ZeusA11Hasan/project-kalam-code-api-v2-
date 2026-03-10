"use client"
import React, { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

export const FlipWords = ({
  words,
  duration = 3000,
  className
}: {
  words: string[]
  duration?: number
  className?: string
}) => {
  const [currentWord, setCurrentWord] = useState(words[0])
  const [isAnimating, setIsAnimating] = useState<boolean>(false)

  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0]
    setCurrentWord(word)
    setIsAnimating(true)
  }, [currentWord, words])

  useEffect(() => {
    if (!isAnimating)
      setTimeout(() => {
        startAnimation()
      }, duration)
  }, [isAnimating, duration, startAnimation])

  return (
    <span className="relative inline-block h-[1.2em] min-w-[200px]">
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          setIsAnimating(false)
        }}
      >
        <motion.span
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10
          }}
          exit={{
            opacity: 0,
            y: -20,
            filter: "blur(4px)"
          }}
          className={cn(
            "absolute left-0 inline-block whitespace-nowrap",
            className
          )}
          key={currentWord}
        >
          {currentWord.split("").map((letter, letterIndex) => (
            <motion.span
              key={currentWord + letterIndex}
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: letterIndex * 0.03,
                duration: 0.2
              }}
              className="inline-block"
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
