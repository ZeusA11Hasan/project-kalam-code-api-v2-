"use client"

import React, { useEffect, useState } from "react"
// Removed AnimatePresence since we are mapping manually for the fade/slide effect as requested for fixed layout behavior
// "absolute... transition-all" approach requested by user.

export default function HeroTitle() {
  const words = [
    "AI Tutor",
    "Live Teacher",
    "Coding Mentor",
    "Writing Assistant",
    "Math & Science Coach",
    "Exam Prep Guide",
    "Study Partner",
    "Problem Solver",
    "Knowledge Guide",
    "Skill Instructor"
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % words.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="mb-16 flex w-full flex-col items-center justify-center">
      {/* 
         FIXED LAYOUT CONTAINER
         flex justify-center keeps the whole block centered.
         But the inner 'animated-container' has a fixed width, so 'Your Personal' + 'Box' 
         will always have the same total width, preventing layout shift of parent.
      */}
      <div className="flex select-none items-center justify-center gap-2 whitespace-nowrap px-6">
        <span
          className="text-[34px] font-extrabold leading-none tracking-tight text-white md:text-[45px] lg:text-[62px]"
          style={{ lineHeight: 0.95 }}
        >
          Your Personal
        </span>

        {/* 
            FIXED WIDTH CONTAINER
            Calculated to fit the longest word ("Math & Science Coach") roughly.
            w-[280px] mobile, w-[400px] md, w-[600px] lg
        */}
        <div className="relative flex h-[1.3em] w-[280px] items-center overflow-hidden md:w-[400px] lg:w-[600px]">
          {words.map((word, i) => (
            <span
              key={word}
              className={`
                        absolute left-0 origin-center text-[34px] font-extrabold leading-none text-[#B76E79] 
                        transition-all duration-500 ease-out md:text-[45px] lg:text-[62px]
                        ${
                          i === index
                            ? "translate-y-0 opacity-100"
                            : "pointer-events-none translate-y-8 opacity-0"
                        }
                    `}
              style={{ lineHeight: 0.95 }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-6 text-lg text-white/60 md:text-xl">
        How can I help you today?
      </p>
    </div>
  )
}
