/**
 * useVoiceInput Hook
 * 
 * Combines STT with backend integration.
 * Handles the full flow: voice → text → backend → response
 * 
 * @example
 * const { startListening, isListening, response, error } = useVoiceInput({
 *   userId: 'user123',
 *   onResponse: (reply) => addToChatMessages(reply)
 * })
 */

"use client"

import { useState, useCallback, useMemo } from 'react'
import { useSpeechToText } from '@/hooks/useSpeechToText'
import { sendTextToBackend, TextResponse, BackendError } from '@/services/backendClient'

export type VoiceInputState = 'idle' | 'listening' | 'processing' | 'error'

export interface UseVoiceInputOptions {
    /** User ID for backend requests */
    userId?: string
    /** Mode for backend (tutor, quiz, explain) */
    mode?: 'tutor' | 'quiz' | 'explain'
    /** Called when backend response is received */
    onResponse?: (response: TextResponse) => void
    /** Called when TTS should speak the reply */
    onSpeak?: (text: string) => void
    /** Called on any error */
    onError?: (error: string) => void
}

export interface UseVoiceInputReturn {
    /** Current state */
    state: VoiceInputState
    /** Start listening for voice input */
    startListening: () => void
    /** Stop listening */
    stopListening: () => void
    /** Is currently listening */
    isListening: boolean
    /** Is processing (backend call) */
    isProcessing: boolean
    /** Current interim transcript */
    interimTranscript: string
    /** Last recognized text */
    transcript: string
    /** Last backend response */
    response: TextResponse | null
    /** Last error message */
    error: string | null
    /** Retry last request */
    retry: () => void
    /** Reset state */
    reset: () => void
    /** Is STT supported */
    isSupported: boolean
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
    const {
        userId = 'anonymous',
        mode = 'tutor',
        onResponse,
        onSpeak,
        onError
    } = options

    const [state, setState] = useState<VoiceInputState>('idle')
    const [response, setResponse] = useState<TextResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [lastTranscript, setLastTranscript] = useState<string>('')

    // Process transcript through backend
    const processTranscript = useCallback(async (text: string) => {
        if (!text.trim()) {
            setError('No speech detected')
            onError?.('No speech detected')
            setState('idle')
            return
        }

        setLastTranscript(text)
        setState('processing')
        setError(null)

        try {
            const result = await sendTextToBackend({
                userId,
                text: text.trim(),
                mode
            })

            if (result.success) {
                setResponse(result.data)
                onResponse?.(result.data)

                // Handle TTS if ui_action is speak or both
                if (result.data.ui_action === 'speak' || result.data.ui_action === 'both') {
                    onSpeak?.(result.data.reply)
                }

                setState('idle')
            } else {
                const errorMsg = result.error.message
                setError(errorMsg)
                onError?.(errorMsg)
                setState('error')

                // Auto-reset after 3 seconds
                setTimeout(() => {
                    if (state === 'error') {
                        setState('idle')
                    }
                }, 3000)
            }
        } catch (err) {
            const errorMsg = 'Unexpected error occurred'
            setError(errorMsg)
            onError?.(errorMsg)
            setState('error')
        }
    }, [userId, mode, onResponse, onSpeak, onError, state])

    // Use STT hook
    const stt = useSpeechToText({
        onResult: (result) => {
            processTranscript(result.transcript)
        },
        onError: (sttError) => {
            setError(sttError.message)
            onError?.(sttError.message)
            setState('error')
        },
        config: {
            language: 'en-IN',
            normalize: true,
            convertMathSymbols: false
        }
    })

    // Start listening
    const startListening = useCallback(() => {
        setError(null)
        setResponse(null)
        setState('listening')
        stt.startListening()
    }, [stt])

    // Stop listening
    const stopListening = useCallback(() => {
        stt.stopListening()
    }, [stt])

    // Retry last request
    const retry = useCallback(() => {
        if (lastTranscript) {
            processTranscript(lastTranscript)
        }
    }, [lastTranscript, processTranscript])

    // Reset state
    const reset = useCallback(() => {
        stt.reset()
        setState('idle')
        setError(null)
        setResponse(null)
        setLastTranscript('')
    }, [stt])

    // Derive state from STT when listening
    const effectiveState = useMemo(() => {
        if (stt.isListening) return 'listening'
        if (state === 'processing') return 'processing'
        if (state === 'error') return 'error'
        return 'idle'
    }, [stt.isListening, state])

    return {
        state: effectiveState,
        startListening,
        stopListening,
        isListening: effectiveState === 'listening',
        isProcessing: effectiveState === 'processing',
        interimTranscript: stt.interimTranscript,
        transcript: stt.transcript || lastTranscript,
        response,
        error,
        retry,
        reset,
        isSupported: stt.isSupported
    }
}

export default useVoiceInput
