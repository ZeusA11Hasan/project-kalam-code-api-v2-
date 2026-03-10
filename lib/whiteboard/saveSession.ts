import type { WhiteboardSession } from "@/types/whiteboardSession"

const KEY = "ai-whiteboard-session"

export function saveSession(session: WhiteboardSession) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch (error) {
    console.warn("Failed to save whiteboard session:", error)
  }
}

export function loadSession(): WhiteboardSession | null {
  if (typeof window === "undefined") return null

  const raw = localStorage.getItem(KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error("Failed to parse whiteboard session:", error)
    return null
  }
}
