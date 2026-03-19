"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export type SpeechLanguage = "en-IN" | "ta-IN"

interface UseWebSpeechOptions {
  language?: SpeechLanguage
  continuous?: boolean
  onFinalTranscript?: (text: string, languageCode?: string, audioUrl?: string) => void
  onInterimTranscript?: (text: string) => void
  onError?: (error: string) => void
}

interface UseWebSpeechReturn {
  isListening: boolean
  isSupported: boolean
  isSpeaking: boolean
  activeStream: MediaStream | null
  activeAudioElement: HTMLAudioElement | null
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  speak: (text: string, lang?: string) => void
  stopSpeaking: () => void
  setLanguage: (lang: SpeechLanguage) => void
  language: SpeechLanguage
}

/**
 * useWebSpeech Hook (v2)
 * 
 * EXCLUSIVELY uses Sarvam AI STT via /api/stt.
 * Removed fallback to Web Speech API SpeechRecognition.
 */
export function useWebSpeech(
  options: UseWebSpeechOptions = {}
): UseWebSpeechReturn {
  const {
    language: initialLang = "ta-IN",
    onFinalTranscript,
    onError
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript] = useState("") // Unused in this version
  const [language, setLanguage] = useState<SpeechLanguage>(initialLang)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check for recording support only
    setIsSupported(!!navigator.mediaDevices?.getUserMedia)
  }, [])

  const stopListening = useCallback(() => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const startListening = useCallback(async () => {
    setIsListening(true)
    setTranscript("")

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser.")
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm"
      })

      audioChunksRef.current = []
      setActiveStream(stream)

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      let startTime = Date.now()
      mediaRecorder.onstop = async () => {
        const duration = (Date.now() - startTime) / 1000
        console.log(`[Sarvam STT] ⏹️ Stopped after ${duration.toFixed(1)}s. Chunks: ${audioChunksRef.current.length}`);

        setActiveStream(null)
        stream.getTracks().forEach(t => t.stop())

        try {
          if (audioChunksRef.current.length === 0) {
            throw new Error("No audio data captured. Please check your mic.");
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          const audioUrl = URL.createObjectURL(audioBlob)

          // Minimum size should be at least 1KB for valid speech
          if (audioBlob.size < 1000) {
            console.warn(`[Sarvam STT] Audio too small: ${audioBlob.size} bytes. User might have not spoken.`);
            throw new Error("I couldn't hear anything. Please speak clearly.");
          }

          console.log(`[Sarvam STT] 📤 Calling API with ${audioBlob.size} bytes...`);

          const formData = new FormData()
          formData.append("file", audioBlob, "audio.webm")
          formData.append("language_code", language) // Use dynamic language from state

          const res = await fetch("/api/stt", {
            method: "POST",
            body: formData
          })

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Cloud STT Error (${res.status})`);
          }

          const data = await res.json()
          if (data.text && data.text.trim().length > 0) {
            console.log("[Sarvam STT] ✅ Success:", data.text);
            const fixed = data.text.trim()
            setTranscript(fixed)
            onFinalTranscript?.(fixed, data.language_code || language, audioUrl)
          } else {
            throw new Error("Sarvam returned an empty transcript. Try again?");
          }
        } catch (err: any) {
          console.error("[Sarvam STT] ❌ Failed:", err.message);
          onError?.(err.message || "STT failed. Try speaking again!");
        }
      }

      mediaRecorderRef.current = mediaRecorder
      // Start with a 1000ms timeslice to ensure ondataavailable fires periodically
      mediaRecorder.start(1000)

      // Auto-stop after 10 seconds of listening
      stopTimerRef.current = setTimeout(() => stopListening(), 10000)

    } catch (err: any) {
      console.error("[STT] Initialization failed:", err)
      setIsListening(false)
      onError?.("Could not access microphone.")
    }
  }, [onFinalTranscript, onError, stopListening])

  const toggleListening = useCallback(() => {
    isListening ? stopListening() : startListening()
  }, [isListening, startListening, stopListening])

  const speak = useCallback(async (text: string, lang?: string) => {
    setIsSpeaking(true)
    const targetLang = lang || "ta-IN"

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language_code: targetLang })
      })

      if (!res.ok) throw new Error("Sarvam TTS failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      setActiveAudioElement(audio)

      audio.onended = () => {
        setIsSpeaking(false)
        setActiveAudioElement(null)
      }

      await audio.play()
    } catch (err) {
      console.error("[TTS] ❌ Sarvam failed:", err);
      setIsSpeaking(false)
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (activeAudioElement) {
      activeAudioElement.pause()
      setActiveAudioElement(null)
    }
    setIsSpeaking(false)
  }, [activeAudioElement])

  return {
    isListening, isSupported, isSpeaking, activeStream, activeAudioElement,
    transcript, interimTranscript, startListening, stopListening, toggleListening,
    speak, stopSpeaking, setLanguage, language
  }
}
