/**
 * Speech-to-Text Service
 * 
 * Uses browser Web Speech API for FREE speech recognition.
 * No backend required - all processing happens client-side.
 * 
 * @module services/sttService
 */

// ============================================
// TYPES
// ============================================

export type STTState = 'idle' | 'listening' | 'processing' | 'error'

export interface STTResult {
    transcript: string
    confidence?: number
    source: 'web-speech-api'
}

export interface STTError {
    code: string
    message: string
}

export interface STTConfig {
    language?: string           // Default: 'en-IN'
    continuous?: boolean        // Default: false
    interimResults?: boolean    // Default: true
    maxAlternatives?: number    // Default: 1
    normalize?: boolean         // Apply Tamil/Hindi normalization (default: true)
    convertMathSymbols?: boolean // Convert spoken math to symbols (default: false)
}

export interface STTCallbacks {
    onStart?: () => void
    onInterim?: (transcript: string) => void
    onResult?: (result: STTResult) => void
    onEnd?: () => void
    onError?: (error: STTError) => void
    onStateChange?: (state: STTState) => void
}

// Get SpeechRecognition constructor (Chrome/Edge use webkit prefix)
const SpeechRecognition =
    typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

/**
 * Check if Web Speech API is supported
 */
export function isSTTSupported(): boolean {
    return !!SpeechRecognition
}

// ============================================
// MINIMAL STT IMPLEMENTATION (Debugging)
// ============================================

export function startBasicSTT(onResult?: (text: string) => void) {
    console.log('[STT] recognition created')

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
        console.error('[STT] Browser not supported')
        return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => console.log('[STT] onstart fired')
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log('[STT] onresult fired:', transcript)
        if (onResult) {
            onResult(transcript)
        }
    }
    recognition.onend = () => console.log('[STT] onend fired')
    recognition.onerror = (event: any) => console.error('[STT] error:', event.error)

    console.log('[STT] recognition.start()')
    recognition.start()
}

// ============================================
// LANGUAGE CONFIGURATION
// ============================================

export type SupportedLanguage = 'en-IN' | 'ta-IN' | 'hi-IN'

export const LANGUAGE_OPTIONS: Record<string, SupportedLanguage> = {
    english: 'en-IN',
    tamil: 'ta-IN',
    hindi: 'hi-IN'
}

// ============================================
// TEXT NORMALIZATION (Tamil/Hindi/English)
// ============================================

/**
 * Common Tamil-English physics term mappings
 */
const TAMIL_ENGLISH_MAP: Record<string, string> = {
    // Physics terms
    'ohms low': "ohm's law",
    'ohms law': "ohm's law",
    'ohm slow': "ohm's law",
    'ampiar': 'ampere',
    'ampiyar': 'ampere',
    'volt age': 'voltage',
    'voltej': 'voltage',
    'kurrent': 'current',
    'resistence': 'resistance',
    'resistor': 'resistor',
    'kapasitor': 'capacitor',
    'induktor': 'inductor',
    'frekuensi': 'frequency',
    'wavelenth': 'wavelength',
    'magnatic': 'magnetic',
    'elektrik': 'electric',
    'potensial': 'potential',
    'enaku': 'enaku', // Tamil "for me" - preserve
    'purila': 'purila', // Tamil "don't understand" - preserve
    'theriyala': 'theriyala', // Tamil "don't know" - preserve
    'solluga': 'solluga', // Tamil "tell me" - preserve
    'enna': 'enna', // Tamil "what" - preserve
    // Math terms
    'integrel': 'integral',
    'diferensial': 'differential',
    'ekuasion': 'equation',
    'formule': 'formula'
}

/**
 * Common Hindi-English physics term mappings
 */
const HINDI_ENGLISH_MAP: Record<string, string> = {
    // Physics terms (Hindi transliterations)
    'vidyut dhara': 'current',
    'vidyut': 'electric',
    'pratirodh': 'resistance',
    'dharita': 'capacitance',
    'vidyut bal': 'electric force',
    'chumbakiya': 'magnetic',
    'aavesh': 'charge',
    'voltata': 'voltage',
    'shakti': 'power',
    'urja': 'energy',
    'kary': 'work',
    'bal': 'force',
    'dhruvikaran': 'polarization',
    'tarang': 'wave',
    'tarang dairghya': 'wavelength',
    'aavrutti': 'frequency',
    // Common phrases
    'mujhe': 'mujhe', // Hindi "to me" - preserve
    'samajh nahi aaya': 'samajh nahi aaya', // Hindi "didn't understand" - preserve
    'kya hai': 'kya hai', // Hindi "what is" - preserve
    'batao': 'batao' // Hindi "tell" - preserve
}

/**
 * Math symbol spoken-to-written conversions
 */
const MATH_SYMBOL_MAP: Array<{ pattern: RegExp; replacement: string }> = [
    // Basic operations
    { pattern: /\bv equals i r\b/gi, replacement: 'V = IR' },
    { pattern: /\bi equals v by r\b/gi, replacement: 'I = V/R' },
    { pattern: /\br equals v by i\b/gi, replacement: 'R = V/I' },
    { pattern: /\bp equals v i\b/gi, replacement: 'P = VI' },
    { pattern: /\bp equals i squared r\b/gi, replacement: 'P = I²R' },
    { pattern: /\be equals m c squared\b/gi, replacement: 'E = mc²' },
    { pattern: /\bf equals m a\b/gi, replacement: 'F = ma' },
    // Operators
    { pattern: /\bequals\b/gi, replacement: '=' },
    { pattern: /\bequal to\b/gi, replacement: '=' },
    { pattern: /\bis equal to\b/gi, replacement: '=' },
    { pattern: /\bby\b/gi, replacement: '/' },
    { pattern: /\bdivided by\b/gi, replacement: '/' },
    { pattern: /\btimes\b/gi, replacement: '×' },
    { pattern: /\bmultiplied by\b/gi, replacement: '×' },
    { pattern: /\binto\b/gi, replacement: '×' },
    { pattern: /\bplus\b/gi, replacement: '+' },
    { pattern: /\bminus\b/gi, replacement: '−' },
    { pattern: /\bsquared\b/gi, replacement: '²' },
    { pattern: /\bcubed\b/gi, replacement: '³' },
    // Greek letters
    { pattern: /\bomega\b/gi, replacement: 'ω' },
    { pattern: /\btheta\b/gi, replacement: 'θ' },
    { pattern: /\bphi\b/gi, replacement: 'φ' },
    { pattern: /\blambda\b/gi, replacement: 'λ' },
    { pattern: /\bmu\b/gi, replacement: 'μ' },
    { pattern: /\bpi\b/gi, replacement: 'π' },
    { pattern: /\balpha\b/gi, replacement: 'α' },
    { pattern: /\bbeta\b/gi, replacement: 'β' },
    { pattern: /\bgamma\b/gi, replacement: 'γ' },
    { pattern: /\bdelta\b/gi, replacement: 'Δ' },
    { pattern: /\bepsilon\b/gi, replacement: 'ε' },
    // Units
    { pattern: /\bohms?\b/gi, replacement: 'Ω' },
    { pattern: /\bvolts?\b/gi, replacement: 'V' },
    { pattern: /\bamps?\b/gi, replacement: 'A' },
    { pattern: /\bamperes?\b/gi, replacement: 'A' },
    { pattern: /\bwatts?\b/gi, replacement: 'W' },
    { pattern: /\bjoules?\b/gi, replacement: 'J' },
    { pattern: /\bhertz\b/gi, replacement: 'Hz' },
    { pattern: /\bmeters?\b/gi, replacement: 'm' },
    { pattern: /\bseconds?\b/gi, replacement: 's' },
    { pattern: /\bkilograms?\b/gi, replacement: 'kg' }
]

/**
 * Normalize transcript text
 * - Apply Tamil/Hindi term mappings
 * - Convert spoken math to symbols
 * - Clean up formatting
 */
export function normalizeTranscript(text: string, convertMathSymbols: boolean = false): string {
    if (!text || text.trim() === '') {
        return ''
    }

    let normalized = text.toLowerCase().trim()

    // Apply Tamil-English mappings
    for (const [spoken, written] of Object.entries(TAMIL_ENGLISH_MAP)) {
        const regex = new RegExp(`\\b${spoken}\\b`, 'gi')
        normalized = normalized.replace(regex, written)
    }

    // Apply Hindi-English mappings
    for (const [spoken, written] of Object.entries(HINDI_ENGLISH_MAP)) {
        const regex = new RegExp(`\\b${spoken}\\b`, 'gi')
        normalized = normalized.replace(regex, written)
    }

    // Apply math symbol conversions (optional - for advanced mode)
    if (convertMathSymbols) {
        for (const { pattern, replacement } of MATH_SYMBOL_MAP) {
            normalized = normalized.replace(pattern, replacement)
        }
    }

    // Clean up whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim()

    // Remove repeated words (common STT artifact)
    normalized = removeRepeatedWords(normalized)

    // Capitalize first letter
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1)

    return normalized
}

/**
 * Remove consecutive repeated words
 */
function removeRepeatedWords(text: string): string {
    const words = text.split(' ')
    const result: string[] = []

    for (let i = 0; i < words.length; i++) {
        if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
            result.push(words[i])
        }
    }

    return result.join(' ')
}

// ============================================
// STT SERVICE CLASS
// ============================================

class STTService {
    private recognition: any = null
    private state: STTState = 'idle'
    private callbacks: STTCallbacks = {}
    private config: STTConfig = {
        language: 'en-IN',
        continuous: false,
        interimResults: true,
        maxAlternatives: 1,
        normalize: true,
        convertMathSymbols: false
    }

    /**
     * Initialize the speech recognition instance
     */
    private init(): boolean {
        console.log('[STT] init() called')

        if (!SpeechRecognition) {
            console.error('[STT] Web Speech API not supported')
            return false
        }

        if (this.recognition) {
            console.log('[STT] recognition already exists, reusing')
            return true
        }

        console.log('[STT] Creating new SpeechRecognition instance')
        this.recognition = new SpeechRecognition()

        // Apply configuration
        this.recognition.lang = this.config.language
        this.recognition.continuous = this.config.continuous
        this.recognition.interimResults = this.config.interimResults
        this.recognition.maxAlternatives = this.config.maxAlternatives

        // Event: Recognition started
        this.recognition.onstart = () => {
            console.log('[STT] onstart fired - now listening')
            this.setState('listening')
            this.callbacks.onStart?.()
        }

        // Event: Speech result received
        this.recognition.onresult = (event: any) => {
            const results = event.results
            const lastResult = results[results.length - 1]

            if (lastResult.isFinal) {
                // Final result - recognition complete
                let transcript = lastResult[0].transcript.trim()
                const confidence = lastResult[0].confidence

                // Apply text normalization (Tamil/Hindi/English)
                if (this.config.normalize !== false) {
                    transcript = normalizeTranscript(
                        transcript,
                        this.config.convertMathSymbols ?? false
                    )
                }

                // Handle empty transcript
                if (!transcript) {
                    this.callbacks.onError?.({
                        code: 'empty-transcript',
                        message: 'No speech recognized. Please try again.'
                    })
                    this.setState('idle')
                    return
                }

                this.setState('processing')

                const result: STTResult = {
                    transcript,
                    confidence,
                    source: 'web-speech-api'
                }

                this.callbacks.onResult?.(result)
            } else {
                // Interim result - still speaking
                const interimTranscript = lastResult[0].transcript
                this.callbacks.onInterim?.(interimTranscript)
            }
        }

        // Event: Recognition ended
        this.recognition.onend = () => {
            this.setState('idle')
            this.callbacks.onEnd?.()
        }

        // Event: Error occurred
        this.recognition.onerror = (event: any) => {
            const error = this.mapError(event.error)
            this.setState('error')
            this.callbacks.onError?.(error)

            // Auto-reset to idle after short delay
            setTimeout(() => {
                if (this.state === 'error') {
                    this.setState('idle')
                }
            }, 2000)
        }

        // Event: No speech detected
        this.recognition.onnomatch = () => {
            this.callbacks.onError?.({
                code: 'no-match',
                message: 'No speech detected. Please try again.'
            })
        }

        return true
    }

    /**
     * Map browser error codes to user-friendly messages
     */
    private mapError(errorCode: string): STTError {
        const errorMap: Record<string, STTError> = {
            'not-allowed': {
                code: 'not-allowed',
                message: 'Microphone permission denied. Please allow mic access.'
            },
            'no-speech': {
                code: 'no-speech',
                message: 'No speech detected. Please speak clearly.'
            },
            'audio-capture': {
                code: 'audio-capture',
                message: 'No microphone found. Please check your device.'
            },
            'network': {
                code: 'network',
                message: 'Network error. Please check your connection.'
            },
            'aborted': {
                code: 'aborted',
                message: 'Speech recognition was aborted.'
            },
            'service-not-allowed': {
                code: 'service-not-allowed',
                message: 'Speech service not allowed. Try a different browser.'
            }
        }

        return errorMap[errorCode] || {
            code: errorCode,
            message: `Speech recognition error: ${errorCode}`
        }
    }

    /**
     * Update state and notify listeners
     */
    private setState(newState: STTState): void {
        this.state = newState
        this.callbacks.onStateChange?.(newState)
    }

    /**
     * Configure the STT service
     */
    configure(config: Partial<STTConfig>): void {
        this.config = { ...this.config, ...config }

        // Apply to existing recognition instance
        if (this.recognition) {
            this.recognition.lang = this.config.language
            this.recognition.continuous = this.config.continuous
            this.recognition.interimResults = this.config.interimResults
            this.recognition.maxAlternatives = this.config.maxAlternatives
        }
    }

    /**
     * Set callbacks for STT events
     */
    setCallbacks(callbacks: STTCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }

    /**
     * Start speech recognition
     */
    start(): boolean {
        console.log('[STT] start() called')

        if (!this.init()) {
            console.error('[STT] init() failed - not supported')
            this.callbacks.onError?.({
                code: 'not-supported',
                message: 'Speech recognition not supported. Use Chrome or Edge.'
            })
            return false
        }

        if (this.state === 'listening') {
            console.log('[STT] Already listening, ignoring start()')
            return true // Already listening
        }

        try {
            console.log('[STT] Calling recognition.start()...')
            this.recognition.start()
            console.log('[STT] recognition.start() succeeded')
            return true
        } catch (error) {
            console.error('[STT] Failed to start:', error)
            this.callbacks.onError?.({
                code: 'start-failed',
                message: 'Failed to start speech recognition.'
            })
            return false
        }
    }

    /**
     * Stop speech recognition
     */
    stop(): void {
        if (this.recognition && this.state === 'listening') {
            this.recognition.stop()
        }
    }

    /**
     * Abort speech recognition immediately
     */
    abort(): void {
        if (this.recognition) {
            this.recognition.abort()
            this.setState('idle')
        }
    }

    /**
     * Get current state
     */
    getState(): STTState {
        return this.state
    }

    /**
     * Check if currently listening
     */
    isListening(): boolean {
        return this.state === 'listening'
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const sttService = new STTService()

// Default export for convenience
export default sttService
