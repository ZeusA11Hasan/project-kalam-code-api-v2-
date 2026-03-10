/**
 * useSpeechToText React Hook
 * 
 * Provides reactive state for speech-to-text functionality.
 * Abstracts the STT service for easy UI integration.
 * 
 * @example
 * const { isListening, transcript, startListening, stopListening, error } = useSpeechToText({
 *   onResult: (result) => console.log(result.transcript)
 * })
 */

"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { sttService, STTState, STTResult, STTError, STTConfig, isSTTSupported } from '@/services/sttService'

export interface UseSpeechToTextOptions {
    /** Callback when final transcript is ready */
    onResult?: (result: STTResult) => void
    /** Callback on error */
    onError?: (error: STTError) => void
    /** Auto-stop after result (default: true) */
    autoStop?: boolean
    /** STT configuration */
    config?: Partial<STTConfig>
}

export interface UseSpeechToTextReturn {
    /** Current STT state */
    state: STTState
    /** Is currently listening */
    isListening: boolean
    /** Is processing recognition */
    isProcessing: boolean
    /** Interim transcript (while speaking) */
    interimTranscript: string
    /** Final transcript from last recognition */
    transcript: string
    /** Last error */
    error: STTError | null
    /** Is Web Speech API supported */
    isSupported: boolean
    /** Start listening */
    startListening: () => void
    /** Stop listening */
    stopListening: () => void
    /** Clear transcript and error */
    reset: () => void
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
    const { onResult, onError, autoStop = true, config } = options

    const [state, setState] = useState<STTState>('idle')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [transcript, setTranscript] = useState('')
    const [error, setError] = useState<STTError | null>(null)

    // Store callbacks in refs to avoid re-binding
    const onResultRef = useRef(onResult)
    const onErrorRef = useRef(onError)

    useEffect(() => {
        onResultRef.current = onResult
        onErrorRef.current = onError
    }, [onResult, onError])

    // Configure service on mount
    useEffect(() => {
        if (config) {
            sttService.configure(config)
        }

        // Set up callbacks
        sttService.setCallbacks({
            onStateChange: (newState) => {
                setState(newState)
            },
            onInterim: (interim) => {
                setInterimTranscript(interim)
            },
            onResult: (result) => {
                setTranscript(result.transcript)
                setInterimTranscript('')
                onResultRef.current?.(result)

                if (autoStop) {
                    sttService.stop()
                }
            },
            onError: (err) => {
                setError(err)
                onErrorRef.current?.(err)
            },
            onEnd: () => {
                setInterimTranscript('')
            }
        })

        return () => {
            // Cleanup: abort any ongoing recognition
            sttService.abort()
        }
    }, [config, autoStop])

    const startListening = useCallback(() => {
        setError(null)
        setInterimTranscript('')
        sttService.start()
    }, [])

    const stopListening = useCallback(() => {
        sttService.stop()
    }, [])

    const reset = useCallback(() => {
        sttService.abort()
        setTranscript('')
        setInterimTranscript('')
        setError(null)
        setState('idle')
    }, [])

    return {
        state,
        isListening: state === 'listening',
        isProcessing: state === 'processing',
        interimTranscript,
        transcript,
        error,
        isSupported: isSTTSupported(),
        startListening,
        stopListening,
        reset
    }
}

export default useSpeechToText
