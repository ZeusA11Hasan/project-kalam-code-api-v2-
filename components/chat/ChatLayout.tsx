"use client"

import { ReactNode } from "react"

interface ChatLayoutProps {
  children?: ReactNode
}

export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="mx-auto flex size-full max-w-4xl flex-col p-4">
      {/* Main Chat Container - Black Glassy */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  )
}
