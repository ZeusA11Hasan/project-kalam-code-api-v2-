import { useState, useRef, useCallback } from "react"

// ─── Text Chunker (400 chars max for speed/reliability) ───
function chunkText(text: string, maxLength: number = 400): string[] {
  const sentences = text.split(/(?<=[.!?।])\s+|(?<=[,])\s+(?=\S{20,})/)
  const chunks: string[] = []
  let current = ""

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length <= maxLength) {
      current = (current + " " + sentence).trim()
    } else {
      if (current) chunks.push(current)
      current = sentence
      // Handle ultra-long sentences
      while (current.length > maxLength) {
        chunks.push(current.slice(0, maxLength))
        current = current.slice(maxLength)
      }
    }
  }
  if (current) chunks.push(current)
  return chunks.filter(c => c.trim().length > 3)
}

// ─── Text Cleaner (Strict) ──────────────────────────────────
function sanitizeTTSText(text: string): string {
  return text
    .replace(/\p{Emoji}/gu, "")             // Strip emojis
    .replace(/[\u2600-\u27FF]/g, "")        // Strip symbols
    .replace(/[\uD800-\uDFFF]/g, "")        // Strip surrogate pairs
    .replace(/[\u0900-\u097F]/g, "")          // Strip Hindi characters
    .replace(/\(([^)]+)\)/g, "")            // Remove (parentheticals)
    .replace(/\[([^\]]+)\]/g, "$1")         // Simplify [brackets]
    .replace(/[*#`_~]/g, "")                // Strip markdown
    .replace(/\s+/g, " ")                   // Collapse whitespace
    .trim()
}

// ─── Language Detection ──────────────────────────────────
function getTTSLanguage(text: string): string {
  // Always return Tamil (ta-IN) for this application
  return "ta-IN"
}

export function useTTS() {
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null)
  const stoppedRef = useRef(false)

  const stopSpeaking = useCallback(() => {
    stoppedRef.current = true
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setActiveAudioElement(null)
    setIsAISpeaking(false)
  }, [])

  const speakText = useCallback(
    async (text: string, language_code?: string) => {
      stopSpeaking()
      stoppedRef.current = false

      const cleaned = sanitizeTTSText(text)
      const chunks = chunkText(cleaned, 400)

      if (chunks.length === 0) return

      const targetLang = language_code || getTTSLanguage(chunks[0])
      setIsAISpeaking(true)

      try {
        for (let i = 0; i < chunks.length; i++) {
          if (stoppedRef.current) break

          const chunk = chunks[i]
          const chunkLang = targetLang // 🔥 Use targetLang determined from getTTSLanguage or param

          console.log(`[TTS] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars) [lang=${chunkLang}]`)

          try {
            await new Promise<void>(async (resolve) => {
              try {
                const response = await fetch("/api/tts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text: chunk, language_code: chunkLang })
                })

                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                if (response.status === 204) return resolve()

                const blob = await response.blob()
                console.log(`[TTS] Audio received: ${blob.size} bytes`)
                if (blob.size < 100) throw new Error("Audio blob too small/empty")


                // Convert Blob to Data URI to prevent "File Not Found" errors
                const reader = new FileReader()
                reader.onloadend = async () => {
                  const dataUri = reader.result as string

                  if (stoppedRef.current) return resolve()

                  const audio = new Audio()
                  // Check for audio format support
                  if (!audio.canPlayType(blob.type)) {
                    console.warn(`[TTS] Audio format ${blob.type} not supported by browser. Skipping chunk.`)
                    return resolve()
                  }
                  audio.src = dataUri
                  audioRef.current = audio
                  setActiveAudioElement(audio)

                  audio.onended = () => resolve()
                  audio.onerror = (e) => {
                    console.error("[TTS] Audio error for chunk:", i, e)
                    resolve()
                  }

                  audio.load()
                  const playPromise = audio.play()
                  if (playPromise !== undefined) {
                    await playPromise.catch(err => {
                      console.warn("[TTS] Play failed, skipping chunk", err)
                      resolve()
                    })
                  }
                }
                reader.readAsDataURL(blob)
              } catch (err) {
                console.error(`[TTS] Chunk ${i + 1} Error:`, err)
                resolve()
              }
            })
          } catch (err) {
            console.error("[TTS] Loop error:", err)
          }
        }
      } finally {
        setIsAISpeaking(false)
        setActiveAudioElement(null)
      }
    },
    [stopSpeaking]
  )

  return {
    speakText,
    stopSpeaking,
    isAISpeaking,
    activeAudioElement
  }
}
