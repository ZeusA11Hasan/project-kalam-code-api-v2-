/**
 * Audio Meter Service
 * 
 * Provides real-time audio level monitoring using Web Audio API.
 * Used for waveform visualization ONLY - does not affect STT.
 * 
 * CRITICAL: Must be started AFTER SpeechRecognition.start()
 * to avoid breaking browser permission flow.
 * 
 * @module services/audioMeterService
 */

// ============================================
// TYPES
// ============================================

export interface AudioMeterCallbacks {
    onLevel?: (level: number) => void  // 0.0 to 1.0
    onStart?: () => void
    onStop?: () => void
}

// ============================================
// AUDIO METER SERVICE
// ============================================

class AudioMeterService {
    private audioContext: AudioContext | null = null
    private analyser: AnalyserNode | null = null
    private mediaStream: MediaStream | null = null
    private source: MediaStreamAudioSourceNode | null = null
    private animationId: number | null = null
    private callbacks: AudioMeterCallbacks = {}
    private isRunning: boolean = false

    /**
     * Set callbacks for audio meter events
     */
    setCallbacks(callbacks: AudioMeterCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }

    /**
     * Start the audio meter
     * MUST be called AFTER SpeechRecognition.start()
     */
    async start(): Promise<boolean> {
        if (this.isRunning) {
            console.log('[AudioMeter] Already running')
            return true
        }

        try {
            console.log('[AudioMeter] Starting...')

            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })

            // Create audio context and analyser
            this.audioContext = new AudioContext()
            this.analyser = this.audioContext.createAnalyser()

            // Configure analyser for smooth levels
            this.analyser.fftSize = 256
            this.analyser.smoothingTimeConstant = 0.8

            // Connect microphone to analyser
            this.source = this.audioContext.createMediaStreamSource(this.mediaStream)
            this.source.connect(this.analyser)

            this.isRunning = true
            console.log('[AudioMeter] Started successfully')
            this.callbacks.onStart?.()

            // Start the level monitoring loop
            this.monitorLevel()

            return true
        } catch (error) {
            console.error('[AudioMeter] Failed to start:', error)
            this.cleanup()
            return false
        }
    }

    /**
     * Monitor audio level using requestAnimationFrame
     */
    private monitorLevel(): void {
        if (!this.isRunning || !this.analyser) {
            return
        }

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
        this.analyser.getByteFrequencyData(dataArray)

        // Calculate RMS (root mean square) for smooth level
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / dataArray.length)

        // Normalize to 0-1 range (max byte value is 255)
        const level = Math.min(rms / 128, 1)

        // Report level to callback
        this.callbacks.onLevel?.(level)

        // Continue monitoring
        this.animationId = requestAnimationFrame(() => this.monitorLevel())
    }

    /**
     * Stop the audio meter
     */
    stop(): void {
        console.log('[AudioMeter] Stopping...')
        this.isRunning = false
        this.cleanup()
        this.callbacks.onStop?.()
    }

    /**
     * Clean up all resources
     */
    private cleanup(): void {
        // Stop animation loop
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }

        // Disconnect audio nodes
        if (this.source) {
            this.source.disconnect()
            this.source = null
        }

        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close()
            this.audioContext = null
        }

        // Stop all media tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop())
            this.mediaStream = null
        }

        this.analyser = null
        console.log('[AudioMeter] Cleaned up')
    }

    /**
     * Check if audio meter is currently running
     */
    getIsRunning(): boolean {
        return this.isRunning
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const audioMeterService = new AudioMeterService()

export default audioMeterService
