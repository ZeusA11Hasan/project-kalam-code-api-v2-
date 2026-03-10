/**
 * useAudioLevel Hook
 * 
 * Provides real-time audio level state for waveform visualization.
 * Starts AFTER STT recognition to maintain permission flow.
 */

"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { audioMeterService } from '@/services/audioMeterService'

export interface UseAudioLevelReturn {
    /** Current audio level (0-1) */
    level: number
    /** Is audio meter active */
    isActive: boolean
    /** Start audio meter (call AFTER recognition.start()) */
    startMeter: () => void
    /** Stop audio meter */
    stopMeter: () => void
}

export function useAudioLevel(): UseAudioLevelReturn {
    const [level, setLevel] = useState(0)
    const [isActive, setIsActive] = useState(false)
    const isStartedRef = useRef(false)

    // Set up callbacks on mount
    useEffect(() => {
        audioMeterService.setCallbacks({
            onLevel: (newLevel) => {
                setLevel(newLevel)
            },
            onStart: () => {
                console.log('[AudioMeter] started')
                setIsActive(true)
            },
            onStop: () => {
                setLevel(0)
                setIsActive(false)
            }
        })

        return () => {
            // Cleanup on unmount
            audioMeterService.stop()
        }
    }, [])

    const startMeter = useCallback(() => {
        if (isStartedRef.current) return
        isStartedRef.current = true

        // Start audio meter (async but we don't await)
        audioMeterService.start().then(success => {
            if (!success) {
                isStartedRef.current = false
            }
        })
    }, [])

    const stopMeter = useCallback(() => {
        isStartedRef.current = false
        audioMeterService.stop()
    }, [])

    return {
        level,
        isActive,
        startMeter,
        stopMeter
    }
}

export default useAudioLevel
