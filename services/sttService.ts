export type STTState = 'idle' | 'listening' | 'processing' | 'error';
export interface STTResult { transcript: string; confidence?: number; source: 'sarvam' | 'web-speech-api'; }
export interface STTError { code: string; message: string; }
export interface STTConfig { language?: string; continuous?: boolean; interimResults?: boolean; maxAlternatives?: number; normalize?: boolean; convertMathSymbols?: boolean; }
export interface STTCallbacks { onStart?: () => void; onInterim?: (transcript: string) => void; onResult?: (result: STTResult) => void; onEnd?: () => void; onError?: (error: STTError) => void; onStateChange?: (state: STTState) => void; }

const SpeechRecognition = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

export function isSTTSupported(): boolean { return !!SpeechRecognition || !!navigator.mediaDevices?.getUserMedia; }

export function startBasicSTT(onResult?: (text: string) => void) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => { const transcript = event.results[0][0].transcript; if (onResult) onResult(transcript); };
    recognition.start();
}

export type SupportedLanguage = 'en-IN' | 'ta-IN' | 'hi-IN';
export const LANGUAGE_OPTIONS: Record<string, SupportedLanguage> = { english: 'en-IN', tamil: 'ta-IN', hindi: 'hi-IN' };

// Maps
const TAMIL_ENGLISH_MAP: Record<string, string> = { 'ohms low': "ohm's law", 'ohms law': "ohm's law", 'ampiar': 'ampere', 'volt age': 'voltage', 'voltej': 'voltage', 'kurrent': 'current', 'resistence': 'resistance', 'resistor': 'resistor', 'kapasitor': 'capacitor', 'induktor': 'inductor', 'frekuensi': 'frequency', 'wavelenth': 'wavelength', 'magnatic': 'magnetic', 'elektrik': 'electric', 'potensial': 'potential', 'enaku': 'enaku', 'purila': 'purila', 'theriyala': 'theriyala', 'solluga': 'solluga', 'enna': 'enna', 'integrel': 'integral', 'diferensial': 'differential', 'ekuasion': 'equation', 'formule': 'formula' };
const HINDI_ENGLISH_MAP: Record<string, string> = { 'vidyut dhara': 'current', 'vidyut': 'electric', 'pratirodh': 'resistance', 'dharita': 'capacitance', 'vidyut bal': 'electric force', 'chumbakiya': 'magnetic', 'aavesh': 'charge', 'voltata': 'voltage', 'shakti': 'power', 'urja': 'energy', 'kary': 'work', 'bal': 'force', 'dhruvikaran': 'polarization', 'tarang': 'wave', 'tarang dairghya': 'wavelength', 'aavrutti': 'frequency', 'mujhe': 'mujhe', 'samajh nahi aaya': 'samajh nahi aaya', 'kya hai': 'kya hai', 'batao': 'batao' };
const MATH_SYMBOL_MAP: Array<{ pattern: RegExp; replacement: string }> = [{ pattern: /\bv equals i r\b/gi, replacement: 'V = IR' }, { pattern: /\bi equals v by r\b/gi, replacement: 'I = V/R' }, { pattern: /\br equals v by i\b/gi, replacement: 'R = V/I' }, { pattern: /\bp equals v i\b/gi, replacement: 'P = VI' }, { pattern: /\bp equals i squared r\b/gi, replacement: 'P = I²R' }, { pattern: /\be equals m c squared\b/gi, replacement: 'E = mc²' }, { pattern: /\bf equals m a\b/gi, replacement: 'F = ma' }, { pattern: /\bequals\b/gi, replacement: '=' }, { pattern: /\bequal to\b/gi, replacement: '=' }, { pattern: /\bis equal to\b/gi, replacement: '=' }, { pattern: /\bby\b/gi, replacement: '/' }, { pattern: /\bdivided by\b/gi, replacement: '/' }, { pattern: /\btimes\b/gi, replacement: '×' }, { pattern: /\bmultiplied by\b/gi, replacement: '×' }, { pattern: /\binto\b/gi, replacement: '×' }, { pattern: /\bplus\b/gi, replacement: '+' }, { pattern: /\bminus\b/gi, replacement: '−' }, { pattern: /\bsquared\b/gi, replacement: '²' }, { pattern: /\bcubed\b/gi, replacement: '³' }, { pattern: /\bomega\b/gi, replacement: 'ω' }, { pattern: /\btheta\b/gi, replacement: 'θ' }, { pattern: /\bphi\b/gi, replacement: 'φ' }, { pattern: /\blambda\b/gi, replacement: 'λ' }, { pattern: /\bmu\b/gi, replacement: 'μ' }, { pattern: /\bpi\b/gi, replacement: 'π' }, { pattern: /\balpha\b/gi, replacement: 'α' }, { pattern: /\bbeta\b/gi, replacement: 'β' }, { pattern: /\bgamma\b/gi, replacement: 'γ' }, { pattern: /\bdelta\b/gi, replacement: 'Δ' }, { pattern: /\bepsilon\b/gi, replacement: 'ε' }, { pattern: /\bohms?\b/gi, replacement: 'Ω' }, { pattern: /\bvolts?\b/gi, replacement: 'V' }, { pattern: /\bamps?\b/gi, replacement: 'A' }, { pattern: /\bamperes?\b/gi, replacement: 'A' }, { pattern: /\bwatts?\b/gi, replacement: 'W' }, { pattern: /\bjoules?\b/gi, replacement: 'J' }, { pattern: /\bhertz\b/gi, replacement: 'Hz' }, { pattern: /\bmeters?\b/gi, replacement: 'm' }, { pattern: /\bseconds?\b/gi, replacement: 's' }, { pattern: /\bkilograms?\b/gi, replacement: 'kg' }];

export function normalizeTranscript(text: string, convertMathSymbols: boolean = false): string {
    if (!text || text.trim() === '') return '';
    let normalized = text.toLowerCase().trim();
    for (const [spoken, written] of Object.entries(TAMIL_ENGLISH_MAP)) normalized = normalized.replace(new RegExp(`\\b${spoken}\\b`, 'gi'), written);
    for (const [spoken, written] of Object.entries(HINDI_ENGLISH_MAP)) normalized = normalized.replace(new RegExp(`\\b${spoken}\\b`, 'gi'), written);
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
    private recognition: any = null;
    private audioChunks: Blob[] = [];
    private state: STTState = 'idle';
    private callbacks: STTCallbacks = {};
    private fallbackTranscript: string = "";

    // Auto-stop logic
    private stopTimer: NodeJS.Timeout | null = null;
    private audioContext: AudioContext | null = null;
    private analyserNode: AnalyserNode | null = null;
    private audioCheckInterval: NodeJS.Timeout | null = null;
    private silenceCount: number = 0;

    public config: STTConfig = { language: 'en-IN', continuous: false, interimResults: true, maxAlternatives: 1, normalize: true, convertMathSymbols: false };

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

                // Threshold < 10 for 2 seconds (200ms * 10 checks)
                if (average < 10) {
                    this.silenceCount++;
                    if (this.silenceCount >= 10) {
                        console.log("[STT] Auto-stopping due to 2 seconds of silence");
                        this.stop();
                    }
                } else {
                    this.silenceCount = 0; // Reset consecutive silence
                }
            }, 200);
        } catch (e) {
            console.warn("Failed to set up native audio silence detection:", e);
        }
    }

    async start(): Promise<boolean> {
        if (this.state === 'listening' || this.state === 'processing') return true;

        this.fallbackTranscript = "";
        let micStarted = false;
        this.clearTimers();

        try {
            if (navigator.mediaDevices?.getUserMedia) {
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

                    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    this.setState('processing');

                    try {
                        const formData = new FormData();
                        formData.append("file", blob, "audio.webm");
                        const res = await fetch("/api/stt", { method: "POST", body: formData });
                        if (!res.ok) throw new Error("Sarvam Primary STT failed");

                        const data = await res.json();
                        if (data.text) {
                            console.log("[STT] Sarvam STT Success:", data.text);
                            this.dispatchFinalResult(data.text, 'sarvam');
                            return;
                        }
                    } catch (error) {
                        console.error("[STT] Sarvam STT failed, using fallback:", error);
                        if (this.fallbackTranscript) {
                            this.dispatchFinalResult(this.fallbackTranscript, 'web-speech-api');
                        } else {
                            this.callbacks.onError?.({ code: 'network', message: 'Primary AND fallback STT failed.' });
                            this.setState('idle');
                        }
                    }
                };

                this.mediaRecorder.start();
                micStarted = true;
                this.setState('listening');
                this.callbacks.onStart?.();

                // Hard fallback: 5 seconds absolute max if audio detection fails
                this.stopTimer = setTimeout(() => {
                    if (this.state === 'listening') {
                        console.log("[STT] 5-second hard limit hit, stopping automatically");
                        this.stop();
                    }
                }, 5000);
            }
        } catch (error) {
            console.warn("[STT] MediaRecorder init failed, trying Web Speech Fallback Only.", error);
        }

        if (SpeechRecognition) {
            if (this.recognition) { try { this.recognition.stop(); } catch { } }
            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.config.language;
            this.recognition.continuous = this.config.continuous;
            this.recognition.interimResults = this.config.interimResults;
            this.recognition.maxAlternatives = this.config.maxAlternatives;

            if (!micStarted) {
                this.recognition.onstart = () => { this.setState('listening'); this.callbacks.onStart?.(); };
            }

            this.recognition.onresult = (event: any) => {
                const results = event.results;
                const lastResult = results[results.length - 1];
                if (lastResult.isFinal) {
                    let transcript = lastResult[0].transcript.trim();
                    this.fallbackTranscript += transcript + " ";
                    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                        this.dispatchFinalResult(transcript, 'web-speech-api');
                    }
                } else {
                    this.callbacks.onInterim?.(lastResult[0].transcript);
                    // Reset safety timer when interim text flows, assuming speaking
                    if (this.stopTimer) {
                        clearTimeout(this.stopTimer);
                        this.stopTimer = setTimeout(() => { if (this.state === 'listening') this.stop(); }, 5000);
                    }
                }
            };

            this.recognition.onend = () => {
                if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                    this.setState('idle');
                    this.callbacks.onEnd?.();
                }
            };

            this.recognition.onerror = (event: any) => {
                if (!micStarted && event.error !== 'aborted') {
                    this.setState('error');
                    this.callbacks.onError?.({ code: event.error, message: `Fallback error: ${event.error}` });
                }
            };

            this.recognition.start();
            return true;
        }

        if (!micStarted) {
            this.callbacks.onError?.({ code: 'not-supported', message: 'Speech recognition requires microphone permissions.' });
            return false;
        }

        return true;
    }

    private dispatchFinalResult(transcript: string, source: 'sarvam' | 'web-speech-api') {
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
        if (this.recognition) { try { this.recognition.stop(); } catch { } }
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
