/**
 * VoiceInputButton Component
 * 
 * Voice input button with proper STT integration.
 * - Toggle behavior: click to start, click again to stop
 * - Continuous listening with interim results
 * - Appends to existing input (doesn't overwrite)
 */

"use client"

import { useRef, useState, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface VoiceInputButtonProps {
    onInterim?: (text: string) => void
    onFinal?: (text: string) => void
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
    // Reference to get current input value for appending
    getCurrentInput?: () => string
    onClick?: () => void
}

export function VoiceInputButton({
    onInterim,
    onFinal,
    disabled = false,
    size = 'md',
    className = '',
    getCurrentInput,
    onClick
}: VoiceInputButtonProps) {
    const [isListening, setIsListening] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const recognitionRef = useRef<any>(null)
    // Track the text that was in the input before we started listening
    const baseTextRef = useRef<string>('')

    // Track mount state for hydration-safe rendering
    useEffect(() => {
        setIsMounted(true)
    }, [])

    const sizeClasses = {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4'
    }

    const iconSize = {
        sm: 16,
        md: 20,
        lg: 24
    }

    const startListening = () => {
        console.log('[STT] initializing...')

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) {
            console.error('[STT] Browser not supported')
            return
        }

        // Store current input text as base for appending
        baseTextRef.current = getCurrentInput ? getCurrentInput() : ''
        console.log('[STT] base text:', baseTextRef.current)

        const recognition = new SpeechRecognition()
        recognition.lang = 'en-IN'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onstart = () => {
            console.log('[STT] started listening')
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            let interimTranscript = ''
            let finalTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript
                    console.log('[STT] final result:', transcript)
                } else {
                    interimTranscript += transcript
                    console.log('[STT] interim result:', transcript)
                }
            }

            // Build the full text: base + space + new speech
            const separator = baseTextRef.current.length > 0 ? ' ' : ''

            if (finalTranscript) {
                // Final result - update base text for next utterance
                baseTextRef.current = baseTextRef.current + separator + finalTranscript
                if (onFinal) {
                    onFinal(baseTextRef.current)
                }
                if (onInterim) {
                    onInterim(baseTextRef.current)
                }
            } else if (interimTranscript) {
                // Interim result - show preview without updating base
                const previewText = baseTextRef.current + separator + interimTranscript
                if (onInterim) {
                    onInterim(previewText)
                }
            }
        }

        recognition.onend = () => {
            console.log('[STT] stopped')
            setIsListening(false)
            recognitionRef.current = null
        }

        recognition.onerror = (event: any) => {
            console.error('[STT] error:', event.error)
            setIsListening(false)
            recognitionRef.current = null
        }

        recognitionRef.current = recognition
        console.log('[STT] recognition.start()')
        recognition.start()
        console.log('[STT] initialized')
    }

    const stopListening = () => {
        console.log('[STT] stopping...')
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
    }

    const handleClick = () => {
        console.log('[MicButton] clicked, isListening:', isListening)

        if (onClick) {
            onClick();
            return;
        }

        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    // Check if STT is supported - ONLY after mount to avoid hydration mismatch
    const isSupported = isMounted &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

    // Only disable based on isSupported AFTER mount
    const isDisabled = disabled || (isMounted && !isSupported)

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            title={
                !isMounted
                    ? 'Loading...'
                    : !isSupported
                        ? 'Speech recognition not supported'
                        : isListening
                            ? 'Stop listening'
                            : 'Start voice input'
            }
            className={`
                relative rounded-full transition-all duration-200
                ${sizeClasses[size]}
                ${isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/[0.05] text-white/60 backdrop-blur-md hover:bg-white/10 hover:text-white'
                }
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${className}
            `}
        >
            {/* Pulse animation when listening */}
            {isListening && (
                <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-30" />
                    <span className="absolute inset-0 animate-pulse rounded-full bg-red-500 opacity-20" />
                </>
            )}

            {/* Icon - always show Mic on server/initial render to avoid hydration mismatch */}
            <span className="relative z-10">
                {isMounted && !isSupported ? (
                    <MicOff size={iconSize[size]} />
                ) : (
                    <Mic size={iconSize[size]} />
                )}
            </span>
        </button>
    )
}

export default VoiceInputButton
