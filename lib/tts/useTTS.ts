import { useState, useRef, useCallback } from "react"

// ─── Text Chunker ─────────────────────────────────────────
// Splits long text into ≤maxLength chunks at natural sentence
// boundaries so Sarvam TTS (500 char limit) doesn't error.
function chunkText(text: string, maxLength: number = 400): string[] {
  // Split on sentence endings (Tamil purna viram, period, !, ?)
  const sentences = text.split(/(?<=[।.!?])\s+/)
  const chunks: string[] = []
  let current = ""

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length <= maxLength) {
      current = (current + " " + sentence).trim()
    } else {
      if (current) chunks.push(current)
      // If a single sentence exceeds maxLength, split by comma
      if (sentence.length > maxLength) {
        const parts = sentence.split(/,\s*/)
        let sub = ""
        for (const part of parts) {
          if ((sub + ", " + part).length <= maxLength) {
            sub = sub ? sub + ", " + part : part
          } else {
            if (sub) chunks.push(sub)
            sub = part
          }
        }
        if (sub) chunks.push(sub)
      } else {
        current = sentence
      }
    }
  }
  if (current) chunks.push(current)
  return chunks.filter(c => c.trim().length > 0)
}

// ─── Hook ─────────────────────────────────────────────────
export function useTTS() {
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [activeAudioElement, setActiveAudioElement] =
    useState<HTMLAudioElement | null>(null)
  const stoppedRef = useRef(false) // flag to abort mid-sequence

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
    async (text: string, languageCode?: string) => {
      stopSpeaking() // stop any currently playing audio
      stoppedRef.current = false // reset stop flag for new sequence

      const chunks = chunkText(text, 400)
      console.log(
        `[TTS Hook] speakText called — ${chunks.length} chunk(s), total ${text.length} chars`
      )
      console.log("[TTS Hook] languageCode:", languageCode)

      if (chunks.length === 0) return

      setIsAISpeaking(true)

      for (let i = 0; i < chunks.length; i++) {
        // If stopSpeaking() was called, abort the sequence
        if (stoppedRef.current) {
          console.log(
            "[TTS Hook] Playback stopped by user, aborting remaining chunks"
          )
          break
        }

        const chunk = chunks[i]
        console.log(
          `[TTS Hook] Playing chunk ${i + 1}/${chunks.length}: "${chunk.slice(0, 40)}..."`
        )

        try {
          await new Promise<void>(resolve => {
            fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: chunk,
                language_code: languageCode || "en-IN"
              })
            })
              .then(res => {
                if (!res.ok) {
                  console.error(
                    `[TTS Hook] Chunk ${i + 1} fetch error: ${res.status}`
                  )
                  resolve()
                  return null
                }
                return res.blob()
              })
              .then(blob => {
                if (!blob || blob.size === 0) {
                  console.warn(`[TTS Hook] Chunk ${i + 1} empty blob`)
                  resolve()
                  return
                }

                const url = URL.createObjectURL(blob)
                const audio = new Audio(url)

                audioRef.current = audio
                setActiveAudioElement(audio)

                audio.onended = () => {
                  URL.revokeObjectURL(url)
                  setActiveAudioElement(null)
                  resolve()
                }

                audio.onerror = () => {
                  console.error(
                    `[TTS Hook] Chunk ${i + 1} audio playback error`
                  )
                  URL.revokeObjectURL(url)
                  setActiveAudioElement(null)
                  resolve()
                }

                audio.play().catch(() => {
                  console.error(`[TTS Hook] Chunk ${i + 1} play() rejected`)
                  URL.revokeObjectURL(url)
                  resolve()
                })
              })
              .catch(err => {
                console.error(`[TTS Hook] Chunk ${i + 1} network error:`, err)
                resolve()
              })
          })
        } catch (err) {
          console.error(`[TTS Hook] Unexpected error on chunk ${i + 1}:`, err)
        }
      }

      // Only clear speaking state if we weren't stopped externally
      if (!stoppedRef.current) {
        setIsAISpeaking(false)
        setActiveAudioElement(null)
      }

      console.log("[TTS Hook] All chunks finished")
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
