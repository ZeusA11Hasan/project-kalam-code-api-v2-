"use client"

import React, { useMemo, useRef } from "react"
import { motion, useInView, UseInViewOptions } from "framer-motion"

import { cn } from "@/lib/utils"

interface ShimmeringTextProps {
  /** Text to display with shimmer effect */
  text: string
  /** Animation duration in seconds */
  duration?: number
  /** Delay before starting animation */
  delay?: number
  /** Whether to repeat the animation */
  repeat?: boolean
  /** Pause duration between repeats in seconds */
  repeatDelay?: number
  /** Custom className */
  className?: string
  /** Whether to start animation when component enters viewport */
  startOnView?: boolean
  /** Whether to animate only once */
  once?: boolean
  /** Margin for in-view detection (rootMargin) */
  inViewMargin?: UseInViewOptions["margin"]
  /** Shimmer spread multiplier */
  spread?: number
  /** Base text color */
  color?: string
  /** Shimmer gradient color */
  shimmerColor?: string
}

export function ShimmeringText({
  text,
  duration = 2,
  delay = 0,
  repeat = true,
  repeatDelay = 0.5,
  className,
  startOnView = true,
  once = false,
  inViewMargin,
  spread = 2,
  color = "rgba(255, 255, 255, 0.45)",
  shimmerColor = "#ffffff"
}: ShimmeringTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once, margin: inViewMargin })

  // Determine if we should start animation
  const shouldAnimate = !startOnView || isInView

  return (
    <span
      ref={ref}
      className={cn("relative inline-block whitespace-nowrap", className)}
      style={{
        color: color
      }}
    >
      {/* The Base Text (Always Visible) */}
      <span className="relative z-0">{text}</span>

      {/* The Shimmer Layer (Overlay) */}
      <motion.span
        className="pointer-events-none absolute inset-0 z-10 select-none"
        initial={{ backgroundPosition: "-200% 0" }}
        animate={
          shouldAnimate
            ? {
                backgroundPosition: ["200% 0", "-200% 0"]
              }
            : {}
        }
        transition={{
          repeat: repeat ? Infinity : 0,
          duration,
          delay,
          repeatDelay,
          ease: "linear"
        }}
        style={{
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          backgroundImage: `linear-gradient(90deg, transparent, transparent, ${shimmerColor}, transparent, transparent)`,
          backgroundSize: "200% 100%",
          color: "transparent",
          margin: 0,
          padding: 0
        }}
        aria-hidden="true"
      >
        {text}
      </motion.span>
    </span>
  )
}
