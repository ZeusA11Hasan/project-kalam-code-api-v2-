/**
 * Waveform Visualizer Component
 *
 * Displays real-time audio level as animated bars.
 * Driven by micLevel (0-1) from audioMeterService.
 */

"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { motion } from "framer-motion"

interface WaveformVisualizerProps {
  /** Audio level from 0 to 1 */
  level: number
  /** Number of bars to display */
  bars?: number
  /** Whether actively listening */
  isActive?: boolean
  /** Bar color */
  color?: string
  /** Container size */
  size?: "sm" | "md" | "lg"
}

// Pre-compute bar heights for performance (deterministic to avoid hydration issues)
const generateBarHeights = (
  level: number,
  numBars: number,
  seed: number = 0
): number[] => {
  const heights: number[] = []
  const centerIndex = Math.floor(numBars / 2)

  for (let i = 0; i < numBars; i++) {
    // Create wave pattern - higher in center, lower at edges
    const distanceFromCenter = Math.abs(i - centerIndex) / centerIndex
    const baseHeight = 1 - distanceFromCenter * 0.6

    // Use deterministic variation based on index and seed (no Math.random!)
    const variation = 0.7 + ((i + seed) % 5) * 0.08
    const height = Math.max(
      0.15,
      Math.min(1, baseHeight * level * variation * 1.5)
    )

    heights.push(height)
  }

  return heights
}

export const WaveformVisualizer = memo(function WaveformVisualizer({
  level,
  bars = 5,
  isActive = false,
  color = "#ef4444",
  size = "md"
}: WaveformVisualizerProps) {
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array(bars).fill(0.15)
  )
  const [seed, setSeed] = useState(0)

  // Update bar heights when level changes (client-side only)
  useEffect(() => {
    if (isActive && level > 0) {
      // Increment seed for variety
      setSeed(s => (s + 1) % 100)
      setBarHeights(generateBarHeights(level, bars, seed))
    } else if (!isActive) {
      setBarHeights(Array(bars).fill(0.15))
    }
  }, [level, bars, isActive, seed])

  // Size configurations
  const sizeConfig = {
    sm: { height: 20, barWidth: 3, gap: 2 },
    md: { height: 28, barWidth: 4, gap: 3 },
    lg: { height: 36, barWidth: 5, gap: 4 }
  }

  const config = sizeConfig[size]
  const totalWidth = bars * (config.barWidth + config.gap) - config.gap

  if (!isActive) {
    return null
  }

  return (
    <div
      className="flex items-center justify-center gap-[2px]"
      style={{
        width: totalWidth,
        height: config.height
      }}
    >
      {barHeights.map((height, index) => (
        <motion.div
          key={index}
          className="rounded-full"
          style={{
            backgroundColor: color,
            width: config.barWidth
          }}
          animate={{
            height: height * config.height,
            opacity: 0.6 + height * 0.4
          }}
          transition={{
            duration: 0.05,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
})

export default WaveformVisualizer
