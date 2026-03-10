"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react"
import type { CanvasPayload, CanvasElement } from "./canvasTypes"
import InfiniteCanvas from "./InfiniteCanvas"
import { DEMO_WHITEBOARD_SEQUENCE } from "@/data/DEMO_WHITEBOARD_SEQUENCE"
import LatexBlock from "./LatexBlock"

const FORCE_DEMO_MODE = false // TEMP — remove after verification

type Props = {
  blocks: any[] // Accepting raw blocks
  onSpeak?: (text: string) => void
  onStopSpeak?: () => void
  isVoiceMode?: boolean
}

export default function WhiteboardRenderer({
  blocks,
  onSpeak,
  onStopSpeak,
  isVoiceMode
}: Props) {
  console.log("🎨 WhiteboardRenderer PRE-RENDER", {
    FORCE_DEMO_MODE,
    blocksLength: blocks?.length
  })

  // 1. Extract Sequence from Blocks (STRICT CONTRACT)
  const { sequence } = React.useMemo(() => {
    if (FORCE_DEMO_MODE) {
      console.log("🧪 Whiteboard DEMO MODE ACTIVE")
      return { sequence: DEMO_WHITEBOARD_SEQUENCE }
    }

    // 🧪 MANUAL TEST INJECTION (Only if NO blocks)
    if (!blocks || blocks.length === 0) {
      // Fallback to empty if not in demo mode and no blocks (or could restore old manual test here if desired,
      // but user asked for strict replacement)
      return { sequence: [] }
    }

    // STRICT CONTRACT: Use first valid sequence found
    // No Phase 1 conversion. No legacy fallbacks.
    let foundSequence: any[] = []

    for (const block of blocks) {
      const content = block.content || block
      if (content.sequence && Array.isArray(content.sequence)) {
        foundSequence = content.sequence
        break // Use the first valid whiteboard sequence we find
      }
    }

    if (foundSequence.length === 0) {
      console.warn("⚠️ No valid WhiteboardSequence found in blocks.")
    }

    return { sequence: foundSequence }
  }, [blocks])

  // 2. Step Logic & State
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Auto-Advance Timer
  useEffect(() => {
    if (!sequence || sequence.length === 0 || !isPlaying) return

    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < sequence.length - 1) return prev + 1
        setIsPlaying(false) // Stop at end
        return prev
      })
    }, 4000)

    return () => clearInterval(timer)
  }, [sequence, isPlaying])

  // 4. HANDLERS (User Control Override)
  const handleNext = () => {
    setIsPlaying(false)
    if (currentStepIndex < sequence.length - 1) setCurrentStepIndex(p => p + 1)
  }

  const handlePrev = () => {
    setIsPlaying(false)
    if (currentStepIndex > 0) setCurrentStepIndex(p => p - 1)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStepIndex(0)
  }

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.6), 1.5))
  }

  // 5. VOICE COUPLING (PHASE 5)
  useEffect(() => {
    if (!isVoiceMode || !sequence[currentStepIndex]) return
    onStopSpeak?.() // Cancel previous
    const text = sequence[currentStepIndex].explain
    if (text) onSpeak?.(text)
  }, [currentStepIndex, isVoiceMode, sequence, onSpeak, onStopSpeak])

  useEffect(() => {
    if (!isPlaying && isVoiceMode) onStopSpeak?.()
  }, [isPlaying, isVoiceMode, onStopSpeak])

  // 6. RENDER LOGIC
  const visibleElements = React.useMemo(() => {
    if (!sequence) return []
    const visible: CanvasElement[] = []
    for (let i = 0; i <= currentStepIndex; i++) {
      if (sequence[i] && sequence[i].draw) visible.push(...sequence[i].draw)
    }
    return visible
  }, [sequence, currentStepIndex])

  const currentExplanation = sequence[currentStepIndex]?.explain || ""

  console.log("🎨 WhiteboardRenderer render", {
    steps: sequence?.length
  })

  if (!sequence || sequence.length === 0) return null

  return (
    <div className="relative size-full overflow-hidden bg-[#0a0a0a]">
      {/* 🐛 DEBUG OVERLAY */}
      <div className="absolute left-20 top-20 z-50 border border-red-500 bg-black/50 p-2 font-bold text-red-500">
        DEBUG: RENDERER ACTIVE ({visibleElements.length} elements)
        <br />
        Step: {currentStepIndex}
      </div>

      {/* 🌍 INFINITE CANVAS CONTAINER */}
      <InfiniteCanvas>
        {/* REMOVED AnimatePresence for Debugging */}
        {visibleElements.map((el, i) => (
          <RenderElement
            key={`${currentStepIndex}-${i}`}
            element={el}
            index={i}
          />
        ))}
      </InfiniteCanvas>

      {/* 🎮 PLAYBACK CONTROLS (Bottom Center Overlay) */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-[#1e1e1e]/90 p-2 shadow-2xl backdrop-blur">
        <ControlButton
          icon={<RotateCcw size={16} />}
          onClick={handleReset}
          label="Restart"
        />
        <div className="mx-1 h-4 w-px bg-white/10" />
        <ControlButton
          icon={<SkipBack size={16} />}
          onClick={handlePrev}
          label="Prev"
          disabled={currentStepIndex === 0}
        />
        <ControlButton
          icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
          onClick={() => setIsPlaying(!isPlaying)}
          label={isPlaying ? "Pause" : "Play"}
          active={isPlaying}
        />
        <ControlButton
          icon={<SkipForward size={16} />}
          onClick={handleNext}
          label="Next"
          disabled={currentStepIndex === sequence.length - 1}
        />

        {/* Note: Zoom controls are handled by InfiniteCanvas internally now, 
                    but we keep playback controls here for the sequence. */}
      </div>

      {/* 📝 EXPLANATION OVERLAY (Top Right) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto absolute right-8 top-8 z-40 w-80"
      >
        <div className="rounded-xl border border-white/10 bg-[#1e1e1e]/90 p-5 shadow-2xl backdrop-blur">
          <h3 className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
            <span>
              Step {currentStepIndex + 1} / {sequence.length}
            </span>
            {isPlaying && (
              <span className="animate-pulse text-[10px] text-blue-400">
                ● AUTO-PLAY
              </span>
            )}
          </h3>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-lg font-medium leading-snug text-white"
            >
              {currentExplanation}
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / sequence.length) * 100}%`
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ControlButton({
  icon,
  onClick,
  label,
  active = false,
  disabled = false
}: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative rounded-lg p-2 transition-all duration-200
                ${active ? "bg-blue-500 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}
                ${disabled ? "cursor-not-allowed opacity-30" : "active:scale-95"}
            `}
      title={label}
    >
      {icon}
    </button>
  )
}

// CONSTANTS (Legacy Support)
const LEGACY_SCALE = 40
const ORIGIN_X = 400
const ORIGIN_Y = 300

function RenderElement({
  element,
  index
}: {
  element: CanvasElement
  index: number
}) {
  // 🌐 SMART LAYOUT GRID ENGINE (PHASE 3)
  const GRID_SIZE = 80 // 80px cell size
  const ZONE_OFFSETS = {
    LEFT: 50,
    CENTER: 350,
    RIGHT: 650,
    TOP: 350, // Top aligned with center usually
    BOTTOM: 350
  }

  const getPos = (el: any) => {
    // Priority 1: Grid System
    // We check for zone OR specific grid props
    if (el.zone || (el.row !== undefined && el.col !== undefined)) {
      const zone = el.zone || "CENTER"
      const row = el.row || 0
      const col = el.col || 0

      const zoneX =
        ZONE_OFFSETS[zone as keyof typeof ZONE_OFFSETS] || ZONE_OFFSETS.CENTER
      return {
        x: zoneX + col * GRID_SIZE,
        y: 100 + row * GRID_SIZE
      }
    }

    // Priority 2: Direct Coords (Legacy/Override)
    if ("x" in el && "y" in el) {
      // Treat as offset from Center if no zone
      return { x: 400 + el.x, y: 300 + el.y }
    }

    // Priority 3: Legacy 'at' scale
    if ("at" in el) {
      return {
        x: ORIGIN_X + el.at[0] * LEGACY_SCALE,
        y: ORIGIN_Y - el.at[1] * LEGACY_SCALE
      }
    }

    return { x: 400, y: 300 }
  }

  const pos = getPos(element)

  switch (element.type) {
    case "box": {
      // Adaptive Width based on grid columns
      const width = (element.width || 2) * GRID_SIZE - 20 // -20 padding
      const height = (element.height || 1) * GRID_SIZE - 20

      return (
        <div
          className="absolute z-10 flex items-center justify-center overflow-hidden rounded-lg border border-blue-400/50 bg-blue-500/10 p-2 text-center backdrop-blur-sm"
          style={{
            left: pos.x,
            top: pos.y,
            width: `${width}px`,
            height: `${height}px`
          }}
        >
          <span className="text-xs font-medium leading-tight text-blue-100 md:text-sm">
            {(element as any).label}
          </span>
        </div>
      )
    }

    case "text": {
      return (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="font-handwriting absolute z-20 whitespace-pre text-lg text-white/90"
          style={{ left: pos.x, top: pos.y, fontFamily: '"Caveat", cursive' }}
        >
          {element.value}
        </motion.div>
      )
    }

    case "arrow": {
      let start = { x: 0, y: 0 }
      let end = { x: 0, y: 0 }

      // GRID ARROWS (Phase 3.5)
      if (element.fromZone || element.fromRow !== undefined) {
        start = getPos({
          zone: element.fromZone,
          row: element.fromRow,
          col: element.fromCol
        })
        // Center of the cell? getPos returns top-left currently
        // Let's add partial cell offset
        start.x += GRID_SIZE / 2
        start.y += GRID_SIZE / 2
      } else {
        // Legacy
        const from = Array.isArray(element.from) ? element.from : [0, 0]
        // Y-flip check... logic duplication?
        start = { x: ORIGIN_X + from[0], y: ORIGIN_Y + from[1] }
      }

      if (element.toZone || element.toRow !== undefined) {
        end = getPos({
          zone: element.toZone,
          row: element.toRow,
          col: element.toCol
        })
        end.x += GRID_SIZE / 2
        end.y += GRID_SIZE / 2
      } else {
        const to = Array.isArray(element.to) ? element.to : [0, 0]
        end = { x: ORIGIN_X + to[0], y: ORIGIN_Y + to[1] }
      }

      return (
        <svg className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible">
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="#60a5fa" // blue-400
            strokeWidth="2"
            markerEnd="url(#arrowhead-blue)"
          />
          <defs>
            <marker
              id="arrowhead-blue"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
            </marker>
          </defs>
        </svg>
      )
    }

    // ... (Legacy Cases: Point, Label, Curve)
    case "point": {
      return (
        <motion.div
          drag
          className="absolute z-10 size-3 rounded-full bg-white"
          style={{ left: pos.x, top: pos.y, x: "-50%", y: "-50%" }}
        />
      )
    }

    case "label": {
      return (
        <motion.div
          drag
          className="absolute z-20 rounded bg-black/50 px-2 text-sm text-white"
          style={{ left: pos.x, top: pos.y }}
        >
          {element.text}
        </motion.div>
      )
    }

    case "curve": {
      // Curves need path rendering. Similar to lines, purely visual in this DOM approach.
      // We render a path in SVG.
      // Construct path d based on range.
      let d = `M `
      const rangeStart = element.range?.[0] ?? -5
      const rangeEnd = element.range?.[1] ?? 5
      let first = true

      for (let t = rangeStart; t <= rangeEnd; t += 0.2) {
        try {
          const expr = element.equation.replace(/x/g, `(${t})`)
          const val = eval(expr) // Safe-ish
          const pos = getPos({ at: [t, val] }) // Use legacy getPos logic for curve points
          d += `${first ? "" : "L"} ${pos.x} ${pos.y} `
          first = false
        } catch (e) {}
      }

      return (
        <svg className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible">
          <path d={d} fill="none" stroke="#4ade80" strokeWidth="2" />
        </svg>
      )
    }

    case "latex": {
      if (!(element as any).content) return null
      return (
        <div className="absolute z-20" style={{ left: pos.x, top: pos.y }}>
          <LatexBlock latex={(element as any).content} />
        </div>
      )
    }

    case "system_cooldown": {
      return <CooldownTimer element={element} />
    }

    default:
      return null
  }
}

function CooldownTimer({ element }: { element: any }) {
  const [timeLeft, setTimeLeft] = useState(element.seconds || 30)

  useEffect(() => {
    if (timeLeft <= 0) return
    const interval = setInterval(() => setTimeLeft((t: number) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timeLeft])

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="pointer-events-none absolute left-1/2 top-20 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-3 rounded-full border border-red-500/50 bg-red-500/10 px-6 py-3 shadow-lg shadow-red-500/10 backdrop-blur-md">
        <div className="relative flex size-5 items-center justify-center">
          <div className="absolute size-full animate-ping rounded-full border-2 border-red-500 opacity-30" />
          <div className="size-2 rounded-full bg-red-500" />
        </div>
        <span className="font-mono text-lg font-bold tracking-widest text-red-200">
          {timeLeft > 0 ? `COOLING DOWN: ${timeLeft}s` : "READY TO RETRY"}
        </span>
      </div>
    </motion.div>
  )
}
