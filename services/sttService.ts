export type STTState = 'idle' | 'listening' | 'processing' | 'error';
export interface STTResult { transcript: string; confidence?: number; source: 'sarvam'; }
export interface STTError { code: string; message: string; }
export interface STTConfig { language?: string; normalize?: boolean; convertMathSymbols?: boolean; }
export interface STTCallbacks { onStart?: () => void; onInterim?: (transcript: string) => void; onResult?: (result: STTResult) => void; onEnd?: () => void; onError?: (error: STTError) => void; onStateChange?: (state: STTState) => void; }

export function isSTTSupported(): boolean { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }

export function startBasicSTT(onResult?: (text: string) => void) {
    console.warn("startBasicSTT (Web Speech) is deprecated and removed. Use STTService.");
}

export type SupportedLanguage = 'en-IN' | 'ta-IN';
export const LANGUAGE_OPTIONS: Record<string, SupportedLanguage> = { english: 'en-IN', tamil: 'ta-IN' };

// Maps
const TAMIL_ENGLISH_MAP: Record<string, string> = { 'ohms low': "ohm's law", 'ohms law': "ohm's law", 'ampiar': 'ampere', 'volt age': 'voltage', 'voltej': 'voltage', 'kurrent': 'current', 'resistence': 'resistance', 'resistor': 'resistor', 'kapasitor': 'capacitor', 'induktor': 'inductor', 'frekuensi': 'frequency', 'wavelenth': 'wavelength', 'magnatic': 'magnetic', 'elektrik': 'electric', 'potensial': 'potential', 'enaku': 'enaku', 'purila': 'purila', 'theriyala': 'theriyala', 'solluga': 'solluga', 'enna': 'enna', 'integrel': 'integral', 'diferensial': 'differential', 'ekuasion': 'equation', 'formule': 'formula' };
const MATH_SYMBOL_MAP: Array<{ pattern: RegExp; replacement: string }> = [{ pattern: /\bv equals i r\b/gi, replacement: 'V = IR' }, { pattern: /\bi equals v by r\b/gi, replacement: 'I = V/R' }, { pattern: /\br equals v by i\b/gi, replacement: 'R = V/I' }, { pattern: /\bp equals v i\b/gi, replacement: 'P = VI' }, { pattern: /\bp equals i squared r\b/gi, replacement: 'P = I²R' }, { pattern: /\be equals m c squared\b/gi, replacement: 'E = mc²' }, { pattern: /\bf equals m a\b/gi, replacement: 'F = ma' }, { pattern: /\bequals\b/gi, replacement: '=' }, { pattern: /\bequal to\b/gi, replacement: '=' }, { pattern: /\bis equal to\b/gi, replacement: '=' }, { pattern: /\bby\b/gi, replacement: '/' }, { pattern: /\bdivided by\b/gi, replacement: '/' }, { pattern: /\btimes\b/gi, replacement: '×' }, { pattern: /\bmultiplied by\b/gi, replacement: '×' }, { pattern: /\binto\b/gi, replacement: '×' }, { pattern: /\bplus\b/gi, replacement: '+' }, { pattern: /\bminus\b/gi, replacement: '−' }, { pattern: /\bsquared\b/gi, replacement: '²' }, { pattern: /\bcubed\b/gi, replacement: '³' }, { pattern: /\bomega\b/gi, replacement: 'ω' }, { pattern: /\btheta\b/gi, replacement: 'θ' }, { pattern: /\bphi\b/gi, replacement: 'φ' }, { pattern: /\blambda\b/gi, replacement: 'λ' }, { pattern: /\bmu\b/gi, replacement: 'μ' }, { pattern: /\bpi\b/gi, replacement: 'π' }, { pattern: /\balpha\b/gi, replacement: 'α' }, { pattern: /\bbeta\b/gi, replacement: 'β' }, { pattern: /\bgamma\b/gi, replacement: 'γ' }, { pattern: /\bdelta\b/gi, replacement: 'Δ' }, { pattern: /\bepsilon\b/gi, replacement: 'ε' }, { pattern: /\bohms?\b/gi, replacement: 'Ω' }, { pattern: /\bvolts?\b/gi, replacement: 'V' }, { pattern: /\bamps?\b/gi, replacement: 'A' }, { pattern: /\bamperes?\b/gi, replacement: 'A' }, { pattern: /\bwatts?\b/gi, replacement: 'W' }, { pattern: /\bjoules?\b/gi, replacement: 'J' }, { pattern: /\bhertz\b/gi, replacement: 'Hz' }, { pattern: /\bmeters?\b/gi, replacement: 'm' }, { pattern: /\bseconds?\b/gi, replacement: 's' }, { pattern: /\bkilograms?\b/gi, replacement: 'kg' }];

export function normalizeTranscript(text: string, convertMathSymbols: boolean = false): string {
    if (!text || text.trim() === '') return '';
    let normalized = text.toLowerCase().trim();
    for (const [spoken, written] of Object.entries(TAMIL_ENGLISH_MAP)) normalized = normalized.replace(new RegExp(`\\b${spoken}\\b`, 'gi'), written);
    if (convertMathSymbols) for (const { pattern, replacement } of MATH_SYMBOL_MAP) normalized = normalized.replace(pattern, replacement);
    normalized = normalized.replace(/\s+/g, ' ').trim();
    normalized = removeRepeatedWords(normalized);
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function removeRepeatedWords(text: string): string {
    const words = text.split(' ');
    const result: string[] = [];
    for (let i = 0; i < words.length; i++) if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) result.push(words[i]);
    return result.join(' ');
}

class STTService {
    private mediaRecorder: MediaRecorder | null = null;
    private mediaStream: MediaStream | null = null;
    private audioChunks: Blob[] = [];
    private state: STTState = 'idle';
    private callbacks: STTCallbacks = {};

    // Auto-stop logic
    private stopTimer: NodeJS.Timeout | null = null;
    private audioContext: AudioContext | null = null;
    private analyserNode: AnalyserNode | null = null;
    private audioCheckInterval: NodeJS.Timeout | null = null;
    private silenceCount: number = 0;

    public config: STTConfig = { language: 'en-IN', normalize: true, convertMathSymbols: false };

    private setState(newState: STTState): void {
        this.state = newState;
        this.callbacks.onStateChange?.(newState);
    }

    configure(config: Partial<STTConfig>): void { this.config = { ...this.config, ...config }; }
    setCallbacks(callbacks: STTCallbacks): void { this.callbacks = { ...this.callbacks, ...callbacks }; }

    private clearTimers() {
        if (this.stopTimer) { clearTimeout(this.stopTimer); this.stopTimer = null; }
        if (this.audioCheckInterval) { clearInterval(this.audioCheckInterval); this.audioCheckInterval = null; }
        if (this.audioContext && this.audioContext.state !== 'closed') { try { this.audioContext.close(); } catch { } }
        this.audioContext = null;
        this.analyserNode = null;
        this.silenceCount = 0;
    }

    private setupAudioProcessing(stream: MediaStream) {
        try {
            const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
            this.audioContext = new Ctx();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 256;
            source.connect(this.analyserNode);
            const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

            this.audioCheckInterval = setInterval(() => {
                if (!this.analyserNode) return;
                this.analyserNode.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((acc, val) => acc + val, 0);
                const average = sum / dataArray.length;

                if (average < 10) {
                    this.silenceCount++;
                    if (this.silenceCount >= 10) {
                        console.log("[STT] Auto-stopping due to 2 seconds of silence");
                        this.stop();
                    }
                } else {
                    this.silenceCount = 0;
                }
            }, 200);
        } catch (e) {
            console.warn("Failed to set up native audio silence detection:", e);
        }
    }

    async start(): Promise<boolean> {
        if (this.state === 'listening' || this.state === 'processing') return true;

        this.clearTimers();

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Microphone access is not supported.");
            }

            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            this.audioChunks = [];

            this.setupAudioProcessing(this.mediaStream);

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = async () => {
                this.clearTimers();
                if (this.mediaStream) {
                    this.mediaStream.getTracks().forEach(track => track.stop());
                    this.mediaStream = null;
                }

                // Explicitly type and clean the blob for Sarvam
                const blob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
                this.setState('processing');

                try {
                    const formData = new FormData();
                    formData.append("file", blob, "audio.webm");
                    const res = await fetch("/api/stt", { method: "POST", body: formData });
                    if (!res.ok) throw new Error(`Sarvam STT Failed: ${res.status}`);

                    const data = await res.json();
                    if (data.text) {
                        this.dispatchFinalResult(data.text, 'sarvam');
                    } else {
                        throw new Error("Empty transcript returned from Sarvam.");
                    }
                } catch (error: any) {
                    console.error("[STT] Sarvam STT failed:", error.message);
                    this.callbacks.onError?.({ code: 'network', message: error.message || 'Sarvam AI transcription failed.' });
                    this.setState('idle');
                }
            };

            this.mediaRecorder.start();
            this.setState('listening');
            this.callbacks.onStart?.();

            // 10-second hard limit
            this.stopTimer = setTimeout(() => {
                if (this.state === 'listening') {
                    console.log("[STT] 10-second hard limit hit, stopping automatically");
                    this.stop();
                }
            }, 10000);

            return true;
        } catch (error: any) {
            console.error("[STT] MediaRecorder init failed:", error.message);
            this.callbacks.onError?.({ code: 'not-supported', message: error.message || 'Could not start recording.' });
            return false;
        }
    }

    private dispatchFinalResult(transcript: string, source: 'sarvam') {
        let finalTranscript = transcript.trim();
        if (this.config.normalize !== false) finalTranscript = normalizeTranscript(finalTranscript, this.config.convertMathSymbols ?? false);
        if (!finalTranscript) {
            this.callbacks.onError?.({ code: 'empty-transcript', message: 'No speech recognized. Please try again.' });
            this.setState('idle');
            return;
        }
        this.callbacks.onResult?.({ transcript: finalTranscript, source });
        this.setState('idle');
        this.callbacks.onEnd?.();
    }

    stop(): void {
        this.clearTimers();
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
        if (this.mediaStream) { this.mediaStream.getTracks().forEach(track => track.stop()); this.mediaStream = null; }
    }

    abort(): void {
        this.stop();
        this.setState('idle');
    }

    getState(): STTState { return this.state; }
    isListening(): boolean { return this.state === 'listening'; }
}

export const sttService = new STTService();
export default sttService;
