"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react"
import type {
  WhiteboardSession,
  WhiteboardBlock
} from "@/types/whiteboardSession"
import { saveSession, loadSession } from "@/lib/whiteboard/saveSession"

type WhiteboardContextType = {
  session: WhiteboardSession
  appendBlock: (block: Omit<WhiteboardBlock, "createdAt">) => void
  updateBlock: (id: string, updates: Partial<WhiteboardBlock>) => void
  resetSession: () => void
}

const WhiteboardContext = createContext<WhiteboardContextType | null>(null)

export function WhiteboardProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WhiteboardSession>(() => {
    // Attempt load on initial render (if client)
    // Actually, handling hydration mismatch is easier if we start empty and effect load.
    // But for simplicity/speed let's try direct load if we can, or just effect.
    // To avoid hydration mismatch, let's start with a default and load in effect.
    // However, user requested `loadSession() ?? ...` in `useState`.
    // We can do that but need to be careful about server vs client match if SSR logic used.
    // Since this is a client component likely mounted deep in tree or in `page.tsx` that is client,
    // we can try. To be safe against hydration errors, usually we check `typeof window`.
    if (typeof window !== "undefined") {
      const loaded = loadSession()
      if (loaded) return loaded
    }

    return {
      sessionId: crypto.randomUUID(),
      updatedAt: Date.now(),
      blocks: []
    }
  })

  // Persist on change
  useEffect(() => {
    saveSession({ ...session, updatedAt: Date.now() })
  }, [session])

  // Mount effect to ensure we load if we missed it (optional, but useState init usually covers)
  // Actually, standard Next.js might complain if HTML mismatch.
  // We'll use `useEffect` to load if specific constraints exist, but for now strict requested pattern:

  function appendBlock(block: Omit<WhiteboardBlock, "createdAt">) {
    setSession(
      prev =>
        ({
          ...prev,
          updatedAt: Date.now(),
          blocks: [
            ...prev.blocks,
            { ...block, createdAt: Date.now() }
          ] as WhiteboardBlock[]
        }) as WhiteboardSession
    )
  }

  function updateBlock(id: string, updates: Partial<WhiteboardBlock>) {
    setSession(
      prev =>
        ({
          ...prev,
          updatedAt: Date.now(),
          blocks: prev.blocks.map(b =>
            b.id === id ? { ...b, ...updates } : b
          ) as WhiteboardBlock[]
        }) as WhiteboardSession
    )
  }

  function resetSession() {
    setSession({
      sessionId: crypto.randomUUID(),
      updatedAt: Date.now(),
      blocks: []
    })
  }

  return (
    <WhiteboardContext.Provider
      value={{ session, appendBlock, updateBlock, resetSession }}
    >
      {children}
    </WhiteboardContext.Provider>
  )
}

export function useWhiteboard() {
  const context = useContext(WhiteboardContext)
  if (!context) {
    throw new Error("useWhiteboard must be used within a WhiteboardProvider")
  }
  return context
}
