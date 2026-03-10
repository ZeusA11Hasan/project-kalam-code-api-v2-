"use client"

import { Sparkles } from "lucide-react"

interface ModeButtonProps {
    mode?: string
    onClick?: () => void
}

export function ModeButton({ mode = "Chat", onClick }: ModeButtonProps) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:from-purple-500/30 hover:to-pink-500/30 hover:text-white"
        >
            <Sparkles className="size-3.5" />
            <span>{mode}</span>
        </button>
    )
}
