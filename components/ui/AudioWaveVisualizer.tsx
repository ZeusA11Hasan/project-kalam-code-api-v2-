"use client"

import React, { useEffect, useRef, useState } from "react"

export interface AudioWaveVisualizerProps {
  state: "idle" | "userSpeaking" | "aiSpeaking"
  mediaStream?: MediaStream | null
  audioElement?: HTMLAudioElement | null
}

const mediaElementSourceMap = new WeakMap<
  HTMLAudioElement,
  MediaElementAudioSourceNode
>()

export const AudioWaveVisualizer: React.FC<AudioWaveVisualizerProps> = ({
  state,
  mediaStream,
  audioElement
}) => {
  const [volumes, setVolumes] = useState<number[]>(Array(15).fill(4))
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<AudioNode | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (state === "idle") {
      setVolumes(Array(15).fill(4))
      cleanup()
      return
    }

    let isMounted = true

    const initAudio = () => {
      cleanup()

      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return

      const audioCtx = new Ctx()
      audioCtx.resume()
      audioContextRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128 // Increased fftSize for better frequency resolution
      analyser.smoothingTimeConstant = 0.7
      analyserRef.current = analyser

      if (state === "userSpeaking" && mediaStream) {
        const source = audioCtx.createMediaStreamSource(mediaStream)
        source.connect(analyser)
        sourceNodeRef.current = source
      } else if (state === "aiSpeaking" && audioElement) {
        let source = mediaElementSourceMap.get(audioElement)
        if (!source) {
          try {
            source = audioCtx.createMediaElementSource(audioElement)
            mediaElementSourceMap.set(audioElement, source)
          } catch (e) {
            console.warn("Could not create element source", e)
          }
        }
        if (source) {
          // IMPORTANT: we have to reconnect to the new analyser, and MUST route to destination so audio doesn't mute!
          source.disconnect()
          source.connect(analyser)
          analyser.connect(audioCtx.destination)
          sourceNodeRef.current = source
        }
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLoop = () => {
        if (!isMounted || !analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)

        const newVols = []
        const maxBarH = 24 // smaller waves
        const minBarH = 3

        for (let i = 0; i < 15; i++) {
          // Start reading from a slightly higher bin to skip low hum, space out bins slightly
          const dataIndex = Math.floor(i * 1.5) + 2
          const value = dataArray[dataIndex] || 0

          // Add slight multiplier to make softer voices visible, capped at 255
          const amplifiedValue = Math.min(value * 1.5, 255)
          const height = minBarH + (amplifiedValue / 255) * (maxBarH - minBarH)
          newVols.push(height)
        }
        setVolumes(newVols)

        // Faster visual update for fluid waves
        setTimeout(() => {
          if (isMounted) rafRef.current = requestAnimationFrame(updateLoop)
        }, 16)
      }

      updateLoop()
    }

    initAudio()

    return () => {
      isMounted = false
      cleanup()
    }
  }, [state, mediaStream, audioElement])

  const cleanup = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect()
      } catch {}
      sourceNodeRef.current = null
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch {}
      analyserRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close().catch(() => {})
      } catch {}
      audioContextRef.current = null
    }
  }

  let barColor = ""
  let labelColor = ""
  let label = ""

  if (state === "userSpeaking") {
    barColor = "#ffffff"
    labelColor = "text-white/25"
    label = "Listening"
  } else if (state === "aiSpeaking") {
    barColor = "#22d3ee" // cyan-400
    labelColor = "text-cyan-400/60"
    label = "AI Speaking"
  } else {
    barColor = "rgba(255,255,255,0.4)"
    labelColor = "text-white/15"
    label = "Idle"
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-6 items-center justify-center gap-[3px]">
        {volumes.map((vol, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-75 ease-out"
            style={{
              height: `${vol}px`,
              background: barColor,
              minHeight: "3px"
            }}
          />
        ))}
      </div>
      <span
        className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${labelColor}`}
      >
        {label}
      </span>
    </div>
  )
}

export default AudioWaveVisualizer
