"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface TutorLayoutProps {
  whiteboardPanel: React.ReactNode
  chatPanel: React.ReactNode
  children: React.ReactNode // Input Bar
}

/**
 * TutorLayout
 * Handles the Split Screen (Whiteboard Left, Chat Right)
 * and Mobile Drawer logic.
 */
export default function TutorLayout({
  whiteboardPanel,
  chatPanel,
  children
}: TutorLayoutProps) {
  // Simple Split Layout
  // Left: Whiteboard (60-70%)
  // Right: Chat (30-40%)

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-black text-white">
      {/* Main Content Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT: WHITEBOARD PANEL (Hidden on mobile via generic hidden md:flex) */}
        <div className="relative hidden flex-1 border-r border-white/5 bg-gray-950/50 md:flex">
          {whiteboardPanel}
        </div>

        {/* RIGHT: CHAT PANEL */}
        <div className="relative z-10 flex w-full flex-col bg-black/40 backdrop-blur-xl md:w-[450px] lg:w-[500px]">
          {/* Chat Messages */}
          <div className="custom-scrollbar flex-1 overflow-y-auto p-0">
            {chatPanel}
          </div>

          {/* Input Area (Children) */}
          <div className="border-t border-white/5 bg-black/60 p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
