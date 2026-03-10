/**
 * MicButton Component
 * 
 * Animated microphone button with STT integration.
 * Shows visual feedback for listening/processing states.
 */

"use client"

import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useSpeechToText } from '@/hooks/useSpeechToText'
import { STTResult } from '@/services/sttService'

interface MicButtonProps {
    /** Called when speech is recognized */
    onTranscript?: (text: string) => void
    /** Called with full result object */
    onResult?: (result: STTResult) => void
    /** Disable the button */
    disabled?: boolean
    /** Additional CSS classes */
    className?: string
    /** Button size */
    size?: 'sm' | 'md' | 'lg'
}

export function MicButton({
    onTranscript,
    onResult,
    disabled = false,
    className = '',
    size = 'md'
}: MicButtonProps) {
    const {
        isListening,
        isProcessing,
        isSupported,
        error,
        startListening,
        stopListening
    } = useSpeechToText({
        onResult: (result) => {
            onTranscript?.(result.transcript)
            onResult?.(result)
        },
        config: {
            language: 'en-IN',
            interimResults: true
        }
    })

    const handleClick = () => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    // Size variants
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

    // Determine button state
    const isDisabled = disabled || isProcessing || !isSupported
    const showError = !!error

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            title={
                !isSupported
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
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${showError ? 'ring-2 ring-red-300' : ''}
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

            {/* Icon */}
            <span className="relative z-10">
                {isProcessing ? (
                    <Loader2 size={iconSize[size]} className="animate-spin" />
                ) : isListening ? (
                    <Mic size={iconSize[size]} />
                ) : !isSupported ? (
                    <MicOff size={iconSize[size]} />
                ) : (
                    <Mic size={iconSize[size]} />
                )}
            </span>
        </button>
    )
}

export default MicButton
