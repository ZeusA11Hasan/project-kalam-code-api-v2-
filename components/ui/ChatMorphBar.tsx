"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import {
  ArrowUp,
  Paperclip,
  Square,
  X,
  Mic,
  MicOff,
  Phone,
  Users
} from "lucide-react"
import { AudioWaveVisualizer } from "./AudioWaveVisualizer"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

// --- Utility ---
const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ")

// --- Shared spring config ---
const SPRING = { type: "spring" as const, stiffness: 260, damping: 25 }

// --- Tooltip ---
const ActionTooltip = ({
  children,
  label
}: {
  children: React.ReactNode
  label: string
}) => (
  <div className="group relative whitespace-nowrap">
    {children}
    <div className="pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded-md border border-white/10 bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
      {label}
    </div>
  </div>
)

// ======================================================================
// MAIN COMPONENT — ChatMorphBar
// ======================================================================

export interface ChatMorphBarProps {
  onSend?: (message: string, files?: File[]) => void
  onStop?: () => void
  onStartCall?: () => void
  onEndCall?: () => void
  onMicToggle?: () => void
  isCallActive?: boolean
  isListening?: boolean
  isSpeaking?: boolean
  isLoading?: boolean
  placeholder?: string
  className?: string
  interimTranscript?: string
  mediaStream?: MediaStream | null
  audioElement?: HTMLAudioElement | null
}

export const ChatMorphBar = React.forwardRef<HTMLDivElement, ChatMorphBarProps>(
  (props, ref) => {
    const {
      onSend = () => {},
      onStop,
      onStartCall,
      onEndCall,
      onMicToggle,
      isCallActive = false,
      isListening = false,
      isSpeaking = false,
      isLoading = false,
      placeholder = "Ask me anything...",
      className,
      interimTranscript,
      mediaStream,
      audioElement
    } = props

    const [input, setInput] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [isMounted, setIsMounted] = useState(false)
    const [dockRevealed, setDockRevealed] = useState(true)

    useEffect(() => {
      setIsMounted(true)
    }, [])

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const chatRef = useRef<HTMLDivElement>(null)
    const callDockRef = useRef<HTMLDivElement>(null)
    const initialRender = useRef(true)
    const dockHoveredRef = useRef(false)
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

    // ── Auto-Hide / Reveal Dock on Mouse Proximity ──────────
    const startIdleTimer = useCallback(() => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        if (!dockHoveredRef.current) {
          setDockRevealed(false)
        }
      }, 5000) // Hide after 5s of no bottom-edge activity
    }, [])

    useEffect(() => {
      if (!isCallActive) return

      const handleMouseMove = (e: MouseEvent) => {
        const screenH = window.innerHeight
        const triggerZone = 70 // px from bottom edge — less sensitive

        if (e.clientY > screenH - triggerZone || dockHoveredRef.current) {
          setDockRevealed(true)
          startIdleTimer()
        }
      }

      window.addEventListener("mousemove", handleMouseMove, { passive: true })
      // Start the first idle timer when call becomes active
      startIdleTimer()

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      }
    }, [isCallActive, startIdleTimer])

    // Reset revealed state when call starts
    useEffect(() => {
      if (isCallActive) setDockRevealed(true)
    }, [isCallActive])

    // ── GSAP: Animate dock hide/reveal ──────────────────────
    useGSAP(() => {
      if (!isCallActive || !callDockRef.current) return
      // Only animate if the dock is currently visible (display !== 'none')
      if (callDockRef.current.style.display === "none") return

      if (dockRevealed) {
        gsap.to(callDockRef.current, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "back.out(1.7)", // Springy bounce overshoot
          overwrite: true
        })
      } else {
        gsap.to(callDockRef.current, {
          y: 90, // Slide down so ~half the dock is off-screen
          opacity: 0.3, // Dim significantly
          duration: 0.8,
          ease: "power3.out",
          overwrite: true
        })
      }
    }, [dockRevealed, isCallActive])

    useGSAP(() => {
      if (!isMounted) return

      const tl = gsap.timeline()

      if (isCallActive) {
        // Morph TO Dock
        if (chatRef.current) {
          tl.to(
            chatRef.current,
            {
              scale: 0.95,
              opacity: 0,
              filter: "blur(5px)",
              duration: 0.25,
              ease: "power2.inOut",
              onComplete: () => {
                if (chatRef.current) chatRef.current.style.display = "none"
              }
            },
            0
          )
        }
        if (callDockRef.current) {
          gsap.set(callDockRef.current, {
            display: "flex",
            scale: 0.9,
            y: 20,
            opacity: 0,
            filter: "blur(5px)"
          })
          tl.to(
            callDockRef.current,
            {
              scale: 1,
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.5,
              ease: "back.out(1.2)"
            },
            0.15
          )
        }
      } else {
        // Morph TO Chat
        if (callDockRef.current) {
          tl.to(
            callDockRef.current,
            {
              scale: 0.9,
              y: 20,
              opacity: 0,
              filter: "blur(5px)",
              duration: 0.25,
              ease: "power2.inOut",
              onComplete: () => {
                if (callDockRef.current)
                  callDockRef.current.style.display = "none"
              }
            },
            0
          )
        }
        if (chatRef.current) {
          if (initialRender.current) {
            gsap.set(chatRef.current, {
              display: "flex",
              scale: 1,
              opacity: 1,
              filter: "blur(0px)"
            })
          } else {
            gsap.set(chatRef.current, {
              display: "flex",
              scale: 0.95,
              opacity: 0,
              filter: "blur(5px)"
            })
            tl.to(
              chatRef.current,
              {
                scale: 1,
                opacity: 1,
                filter: "blur(0px)",
                duration: 0.5,
                ease: "back.out(1.2)"
              },
              0.15
            )
          }
        }
      }

      initialRender.current = false
    }, [isCallActive, isMounted])

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
      }
    }, [input])

    const handleSend = useCallback(() => {
      if (!input.trim() && files.length === 0) return
      onSend(input.trim(), files)
      setInput("")
      setFiles([])
      setPreviews([])
    }, [input, files, onSend])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      const validImages = selectedFiles.filter(f => f.type.startsWith("image/"))
      if (validImages.length > 0) {
        setFiles(prev => [...prev, ...validImages])
        validImages.forEach(file => {
          const reader = new FileReader()
          reader.onload = e =>
            setPreviews(prev => [...prev, e.target?.result as string])
          reader.readAsDataURL(file)
        })
      }
    }

    const removeFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index))
      setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleRightButtonClick = () => {
      if (isLoading) {
        onStop?.()
      } else if (input.trim() || files.length > 0) {
        handleSend()
      } else {
        onStartCall?.()
      }
    }

    // ======================================================================
    // RENDER
    // ======================================================================
    return (
      <div ref={ref} className={cn("relative mx-auto w-full", className)}>
        <LayoutGroup>
          {/* ====================================================
                    CHAT INPUT MODE
                 ==================================================== */}
          <div
            ref={chatRef}
            className={cn(
              "relative flex flex-col rounded-[2.5rem] border border-white/[0.02] p-2 backdrop-blur-2xl transition-shadow duration-500",
              isFocused
                ? "shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_2px_2px_6px_rgba(0,0,0,0.7)]"
                : "shadow-[-6px_-6px_14px_rgba(255,255,255,0.02),6px_6px_14px_rgba(0,0,0,0.6)]"
            )}
            style={{
              background:
                "linear-gradient(145deg, rgba(13,13,15,0.92), rgba(8,8,10,0.95))",
              display: "flex" // default visible
            }}
          >
            {/* File Previews */}
            <AnimatePresence>
              {previews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 px-4 pb-1 pt-3"
                >
                  {previews.map((src, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="group relative size-16 overflow-hidden rounded-2xl border border-white/10"
                    >
                      <img
                        src={src}
                        className="size-full object-cover"
                        alt="preview"
                      />
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input row */}
            <div className="flex items-end gap-2 px-2 py-1">
              {/* Attach */}
              <div className="mb-1 flex items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
                <ActionTooltip label="Attach images">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full p-2 text-white/30 transition-all hover:bg-white/5 hover:text-white/70"
                  >
                    <Paperclip size={20} />
                  </button>
                </ActionTooltip>
              </div>

              {/* Textarea */}
              <div className="relative flex min-h-[44px] flex-1 flex-col justify-center">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="scrollbar-none max-h-[200px] w-full resize-none overflow-y-auto border-none bg-transparent px-1 py-3 text-[15px] font-medium text-white outline-none placeholder:text-white/30 focus:outline-none focus:ring-0"
                />
              </div>

              {/* Right action button */}
              <div className="mb-1 flex items-center">
                <motion.button
                  key="right-btn"
                  layout
                  onClick={handleRightButtonClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center justify-center rounded-2xl bg-[rgba(13,13,15,0.92)] p-2.5 backdrop-blur-md transition-all duration-500 focus:outline-none",
                    isLoading
                      ? "text-red-500 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(0,0,0,0.6)]"
                      : input.trim() || files.length > 0
                        ? "text-white shadow-[-3px_-3px_6px_rgba(255,255,255,0.03),3px_3px_6px_rgba(0,0,0,0.6)] hover:shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(0,0,0,0.6)]"
                        : "text-white/40 shadow-[-3px_-3px_6px_rgba(255,255,255,0.03),3px_3px_6px_rgba(0,0,0,0.6)] hover:text-white/80 hover:shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.03),inset_2px_2px_6px_rgba(0,0,0,0.6)]"
                  )}
                >
                  {isLoading ? (
                    <Square size={16} fill="currentColor" />
                  ) : input.trim() || files.length > 0 ? (
                    <ArrowUp size={20} className="stroke-[3]" />
                  ) : (
                    <Mic size={20} />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Call Dock Portal */}
          {isMounted &&
            createPortal(
              <div className="pointer-events-none fixed inset-x-0 bottom-[40px] z-[9999] flex items-end justify-center">
                <div
                  ref={callDockRef}
                  className="pointer-events-auto relative flex w-max max-w-[95vw] items-center justify-center gap-5 rounded-[3rem] px-6 py-3 sm:max-w-fit"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(13,13,15,0.95), rgba(8,8,10,0.98))",
                    boxShadow: [
                      "-10px -10px 25px rgba(255,255,255,0.015)",
                      "12px 12px 30px rgba(0,0,0,0.9)",
                      "inset 0 1px 0 rgba(255,255,255,0.03)"
                    ].join(", "),
                    display: "none" // default hidden
                  }}
                  onMouseEnter={() => {
                    dockHoveredRef.current = true
                    setDockRevealed(true)
                  }}
                  onMouseLeave={() => {
                    dockHoveredRef.current = false
                  }}
                >
                  {/* Mic button */}
                  <div className="z-10 flex flex-col items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => onMicToggle?.()}
                      className={cn(
                        "flex size-12 items-center justify-center rounded-full transition-all duration-300",
                        isListening
                          ? "bg-transparent text-white"
                          : "bg-[#0d0d0f] text-red-500 shadow-[-5px_-5px_12px_rgba(255,255,255,0.04),6px_6px_16px_rgba(0,0,0,0.9)]"
                      )}
                    >
                      {isListening ? (
                        <Mic size={20} strokeWidth={2.5} />
                      ) : (
                        <MicOff size={20} strokeWidth={2.5} />
                      )}
                    </motion.button>
                    <span
                      className={cn(
                        "text-[8px] font-black uppercase tracking-[0.2em]",
                        isListening ? "text-white/25" : "text-red-500/70"
                      )}
                    >
                      {isListening ? "Mic On" : "Muted"}
                    </span>
                  </div>

                  {/* Stop button (visible during LLM generation OR TTS) */}
                  <AnimatePresence>
                    {(isLoading || isSpeaking) && (
                      <motion.div
                        initial={{ scale: 0, width: 0, opacity: 0 }}
                        animate={{ scale: 1, width: "auto", opacity: 1 }}
                        exit={{ scale: 0, width: 0, opacity: 0 }}
                        transition={SPRING}
                        className="z-10 flex flex-col items-center gap-1"
                      >
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => onStop?.()}
                          className="flex size-12 items-center justify-center rounded-full bg-[#0d0d0f] text-red-500 shadow-[-5px_-5px_12px_rgba(255,255,255,0.03),6px_6px_16px_rgba(0,0,0,0.9)]"
                        >
                          <Square size={17} fill="currentColor" />
                        </motion.button>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-500/50">
                          {isSpeaking ? "Speaking" : "Stop"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Waveform (center visual) */}
                  <div className="z-10 flex flex-col items-center">
                    <AudioWaveVisualizer
                      state={
                        isSpeaking
                          ? "aiSpeaking"
                          : isListening
                            ? "userSpeaking"
                            : "idle"
                      }
                      mediaStream={mediaStream || undefined}
                      audioElement={audioElement || undefined}
                    />
                  </div>

                  {/* End call button */}
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={onEndCall}
                    className="relative z-10 mx-16 flex h-11 w-[4.5rem] items-center justify-center rounded-[1.5rem] bg-[#FF3B30] text-white"
                  >
                    <Phone
                      size={22}
                      fill="currentColor"
                      className="relative rotate-[135deg]"
                    />
                  </motion.button>

                  {/* Participants */}
                  <div className="z-10 flex flex-col items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.93 }}
                      className="flex size-12 items-center justify-center rounded-full bg-[#0d0d0f] text-white/35 shadow-[-5px_-5px_12px_rgba(255,255,255,0.025),6px_6px_14px_rgba(0,0,0,0.9)] transition-colors hover:text-white/70"
                    >
                      <Users size={20} strokeWidth={2.5} />
                    </motion.button>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
                      Call
                    </span>
                  </div>

                  {/* Border accent */}
                  <div className="pointer-events-none absolute inset-0 rounded-[3rem] border border-white/[0.04]" />
                </div>
              </div>,
              document.body
            )}
        </LayoutGroup>

        {/* Bottom shadow cast */}
        <div className="pointer-events-none mx-auto -mt-2 h-1 w-[80%] rounded-full bg-white/20 opacity-20 blur-2xl" />
      </div>
    )
  }
)

ChatMorphBar.displayName = "ChatMorphBar"
