"use client"

import { useEffect, useState } from "react"

export default function Loading() {
  const [show, setShow] = useState(true)

  // Auto-hide after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 7000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div
      className="animate-fadeOut fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl"
      style={{ animationDelay: "6s", animationDuration: "1s" }}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/10 blur-3xl"></div>
      </div>

      {/* Main loader content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Simple spinner */}
        <div className="size-16 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>

        {/* Loading text */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium text-white">Loading</span>
          <div className="flex gap-1">
            <span className="size-1.5 animate-bounce rounded-full bg-white"></span>
            <span
              className="size-1.5 animate-bounce rounded-full bg-white"
              style={{ animationDelay: "0.1s" }}
            ></span>
            <span
              className="size-1.5 animate-bounce rounded-full bg-white"
              style={{ animationDelay: "0.2s" }}
            ></span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            pointer-events: none;
          }
        }
        .animate-fadeOut {
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  )
}
