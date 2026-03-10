"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Mic, MicOff, Volume2, VolumeX, Settings, Loader2 } from "lucide-react"
import { useVoskSTT } from "@/hooks/useVoskSTT"

interface VoiceControlsProps {
  onTranscript?: (text: string) => void
  textToSpeak?: string
  useOpenAITTS?: boolean // Use OpenAI TTS instead of browser
}

export default function VoiceControls({
  onTranscript,
  textToSpeak,
  useOpenAITTS = true // Default to OpenAI TTS for cross-browser support
}: VoiceControlsProps) {
  // Vosk STT State
  const {
    isLoading: isVoskLoading,
    isListening,
    isModelLoaded,
    transcript,
    partialTranscript,
    error: voskError,
    startListening: voskStart,
    stopListening: voskStop,
    loadModel
  } = useVoskSTT({
    debug: process.env.NODE_ENV === "development",
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        onTranscript?.(text.trim())
      }
    },
    onError: err => {
      console.error("Vosk STT Error:", err)
    }
  })

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [rate, setRate] = useState(0.95)
  const [pitch, setPitch] = useState(1)
  const [ttsError, setTtsError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load browser voices (fallback)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
        const indianVoice = availableVoices.find(v => v.lang === "en-IN")
        const englishVoice = availableVoices.find(v => v.lang.startsWith("en"))
        if (indianVoice) {
          setSelectedVoice(indianVoice.name)
        } else if (englishVoice) {
          setSelectedVoice(englishVoice.name)
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0].name)
        }
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // OpenAI TTS (cheap model)
  const speakWithOpenAI = useCallback(
    async (text: string) => {
      if (!text || isSpeaking) return

      setIsSpeaking(true)
      setTtsError(null)

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        })

        if (!response.ok) {
          throw new Error("TTS request failed")
        }

        const arrayBuffer = await response.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: "audio/wav" })
        const url = URL.createObjectURL(blob)

        if (audioRef.current) {
          audioRef.current.pause()
          URL.revokeObjectURL(audioRef.current.src)
        }

        const audio = new Audio(url)
        audioRef.current = audio

        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(url)
        }

        audio.onerror = () => {
          setIsSpeaking(false)
          setTtsError("Audio playback failed")
        }

        await audio.play()
      } catch (err: any) {
        console.error("OpenAI TTS Error:", err)
        setTtsError(err.message)
        setIsSpeaking(false)

        // Fallback to browser TTS
        speakWithBrowser(text)
      }
    },
    [isSpeaking]
  )

  // Browser TTS (fallback)
  const speakWithBrowser = useCallback(
    (text: string) => {
      if (!text || isSpeaking) return
      if (!window.speechSynthesis) {
        setTtsError("Browser TTS not supported")
        return
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = pitch

      const voice = voices.find(v => v.name === selectedVoice)
      if (voice) utterance.voice = voice

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [isSpeaking, rate, pitch, selectedVoice, voices]
  )

  // Unified speak function
  const speak = useCallback(
    (text: string) => {
      if (useOpenAITTS) {
        speakWithOpenAI(text)
      } else {
        speakWithBrowser(text)
      }
    },
    [useOpenAITTS, speakWithOpenAI, speakWithBrowser]
  )

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  // Auto-speak when textToSpeak changes
  useEffect(() => {
    if (textToSpeak) {
      speak(textToSpeak)
    }
  }, [textToSpeak, speak])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      voskStop()
    } else {
      voskStart()
    }
  }, [isListening, voskStart, voskStop])

  // Error display
  const displayError = voskError || ttsError

  return (
    <div className="relative flex items-center gap-2">
      {/* Hidden audio element for OpenAI TTS */}
      <audio ref={audioRef} className="hidden" />

      {/* STT Toggle (Vosk) */}
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={toggleListening}
        disabled={isVoskLoading}
        title={isListening ? "Stop listening" : "Start voice input"}
        className="relative"
      >
        {isVoskLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isListening ? (
          <>
            <MicOff className="size-4" />
            {/* Listening animation */}
            <span className="absolute -right-1 -top-1 size-3 animate-pulse rounded-full bg-red-500" />
          </>
        ) : (
          <Mic className="size-4" />
        )}
      </Button>

      {/* TTS Toggle */}
      <Button
        variant={isSpeaking ? "destructive" : "outline"}
        size="icon"
        onClick={isSpeaking ? stopSpeaking : undefined}
        disabled={!isSpeaking}
        title={isSpeaking ? "Stop speaking" : "TTS inactive"}
      >
        {isSpeaking ? (
          <VolumeX className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </Button>

      {/* Settings Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSettings(!showSettings)}
        title="Voice settings"
      >
        <Settings className="size-4" />
      </Button>

      {/* Partial transcript display */}
      {isListening && partialTranscript && (
        <div className="absolute bottom-full left-0 mb-2 max-w-xs truncate rounded-lg bg-gray-900 px-3 py-1 text-sm text-white">
          {partialTranscript}
        </div>
      )}

      {/* Error display */}
      {displayError && (
        <div className="absolute bottom-full left-0 mb-2 rounded bg-red-500 px-2 py-1 text-xs text-white">
          {displayError}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-72 rounded-lg border bg-white p-4 shadow-lg dark:bg-gray-800">
          <h4 className="mb-3 font-medium">Voice Settings</h4>

          {/* Model Status */}
          <div className="mb-4 rounded bg-gray-100 p-2 text-sm dark:bg-gray-700">
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full${isModelLoaded ? "bg-green-500" : "bg-yellow-500"}`}
              />
              <span>
                {isModelLoaded ? "Vosk Model Loaded" : "Model Not Loaded"}
              </span>
            </div>
            {!isModelLoaded && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={loadModel}
                disabled={isVoskLoading}
              >
                {isVoskLoading ? "Loading..." : "Pre-load Model"}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Voice Selection (for browser TTS fallback) */}
            {!useOpenAITTS && (
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map(voice => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Speed: {rate.toFixed(2)}</Label>
              <Slider
                value={[rate]}
                onValueChange={([v]) => setRate(v)}
                min={0.5}
                max={2}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <Label>Pitch: {pitch.toFixed(1)}</Label>
              <Slider
                value={[pitch]}
                onValueChange={([v]) => setPitch(v)}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>

            {/* TTS Source indicator */}
            <div className="mt-2 text-xs text-gray-500">
              TTS: {useOpenAITTS ? "OpenAI (gpt-4o-mini-tts)" : "Browser"}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
