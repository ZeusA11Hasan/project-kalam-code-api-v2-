"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ───────────────────────────────────────────
export type SpeechLanguage = "en-IN" | "ta-IN" | "hi-IN";

interface UseWebSpeechOptions {
    language?: SpeechLanguage;
    continuous?: boolean;
    onFinalTranscript?: (text: string, languageCode?: string) => void;
    onInterimTranscript?: (text: string) => void;
    onError?: (error: string) => void;
}

interface UseWebSpeechReturn {
    isListening: boolean;
    isSupported: boolean;
    isSpeaking: boolean;
    activeStream: MediaStream | null;
    activeAudioElement: HTMLAudioElement | null;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    toggleListening: () => void;
    speak: (text: string, lang?: string) => void;
    stopSpeaking: () => void;
    setLanguage: (lang: SpeechLanguage) => void;
    language: SpeechLanguage;
}

// ─── Hook ────────────────────────────────────────────
export function useWebSpeech(options: UseWebSpeechOptions = {}): UseWebSpeechReturn {
    const {
        language: initialLang = "en-IN",
        continuous = false,
        onFinalTranscript,
        onInterimTranscript,
        onError,
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [language, setLanguage] = useState<SpeechLanguage>(initialLang);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fallbackTranscriptRef = useRef<string>("");

    // Auto-stop timers and analyzers
    const stopTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserNodeRef = useRef<AnalyserNode | null>(null);
    const audioCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const silenceCountRef = useRef<number>(0);

    // ── Check browser support ──
    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition || !!navigator.mediaDevices?.getUserMedia);
    }, []);

    const clearTimers = useCallback(() => {
        if (stopTimerRef.current) {
            clearTimeout(stopTimerRef.current);
            stopTimerRef.current = null;
        }
        if (audioCheckIntervalRef.current) {
            clearInterval(audioCheckIntervalRef.current);
            audioCheckIntervalRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            try { audioContextRef.current.close(); } catch { }
        }
        audioContextRef.current = null;
        analyserNodeRef.current = null;
        silenceCountRef.current = 0;
    }, []);

    const setupAudioProcessing = useCallback((stream: MediaStream) => {
        try {
            const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
            audioContextRef.current = new Ctx();
            const source = audioContextRef.current.createMediaStreamSource(stream);

            analyserNodeRef.current = audioContextRef.current.createAnalyser();
            analyserNodeRef.current.fftSize = 256;
            source.connect(analyserNodeRef.current);

            const dataArray = new Uint8Array(analyserNodeRef.current.frequencyBinCount);

            audioCheckIntervalRef.current = setInterval(() => {
                if (!analyserNodeRef.current || !isListening) return;

                analyserNodeRef.current.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((acc, val) => acc + val, 0);
                const average = sum / dataArray.length;

                // Test if average volume goes below threshold 10 for 2 seconds (10 intervals of 200ms)
                if (average < 10) {
                    silenceCountRef.current += 1;
                    if (silenceCountRef.current >= 10) {
                        console.log("[WebSpeech Hook] Auto-stopping due to 2 seconds of silence");
                        stopListening(); // Native auto-stop call inside hook scope
                    }
                } else {
                    silenceCountRef.current = 0; // Speaking resumed, reset silence tracker
                }
            }, 200);

        } catch (e) {
            console.warn("Failed to set up native audio silence detection:", e);
        }
    }, [isListening]);

    // ── Start Listening ──
    const startListening = useCallback(async () => {
        setIsListening(true);
        setTranscript("");
        setInterimTranscript("");
        fallbackTranscriptRef.current = "";
        clearTimers(); // reset immediately

        let mediaRecorderStarted = false;
        try {
            if (navigator.mediaDevices?.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                audioChunksRef.current = [];

                setActiveStream(stream);

                // Bind stream into Analyser checks
                setupAudioProcessing(stream);

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        audioChunksRef.current.push(e.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    setActiveStream(null);
                    clearTimers();
                    stream.getTracks().forEach(track => track.stop());

                    try {
                        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                        const formData = new FormData();
                        formData.append("file", audioBlob, "audio.webm");

                        const res = await fetch("/api/stt", {
                            method: "POST",
                            body: formData,
                        });

                        if (!res.ok) throw new Error("Sarvam STT Failed");

                        const data = await res.json();
                        if (data.text) {
                            console.log("[WebSpeech] ✅ Sarvam STT Success:", data.text, data.language_code);
                            const finalResult = data.text.trim();
                            setTranscript(finalResult);
                            onFinalTranscript?.(finalResult, data.language_code);
                            return;
                        }
                    } catch (err) {
                        console.error("[WebSpeech] ❌ Sarvam STT error, using Web Speech fallback:", err);
                        if (fallbackTranscriptRef.current) {
                            const trimmedFallback = fallbackTranscriptRef.current.trim();
                            setTranscript(trimmedFallback);
                            onFinalTranscript?.(trimmedFallback);
                        } else {
                            onError?.("Speech recognition failed on both Sarvam and fallback APIs.");
                        }
                    }
                };

                mediaRecorderRef.current = mediaRecorder;
                mediaRecorder.start();
                mediaRecorderStarted = true;

                // Define 5-second hard limit fallback globally attached to stream init
                stopTimerRef.current = setTimeout(() => {
                    console.log("[WebSpeech Hook] 5-second max duration reached. Auto-stopping.");
                    stopListening();
                }, 5000);
            }
        } catch (mediaErr) {
            console.warn("[WebSpeech] ⚠️ MediaRecorder start failed, relying entirely on Web Speech fallback.", mediaErr);
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            if (!mediaRecorderStarted) {
                onError?.("Web Speech API not supported and Mic access failed.");
                setIsListening(false);
            }
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log("[WebSpeech] 🎤 Web Speech Listening started (Interim/Fallback mode)");
        };

        recognition.onresult = (event: any) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += text;
                } else {
                    interim += text;
                }
            }

            if (interim) {
                setInterimTranscript(interim);
                onInterimTranscript?.(interim);

                // Native fallback for timeout if speaking continues (reset 5s timer)
                if (stopTimerRef.current) {
                    clearTimeout(stopTimerRef.current);
                    stopTimerRef.current = setTimeout(() => stopListening(), 5000);
                }
            }

            if (final) {
                fallbackTranscriptRef.current += final + " ";
                const trimmed = fallbackTranscriptRef.current.trim();

                if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
                    setTranscript(trimmed);
                    setInterimTranscript("");
                    onFinalTranscript?.(trimmed);
                }
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error !== "aborted" && !mediaRecorderStarted) {
                onError?.(event.error);
            }
            if (!mediaRecorderStarted) setIsListening(false);
        };

        recognition.onend = () => {
            recognitionRef.current = null;
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();

    }, [language, continuous, onFinalTranscript, onInterimTranscript, onError, setupAudioProcessing]);

    // ── Stop Listening ──
    const stopListening = useCallback(() => {
        clearTimers();

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }

        setIsListening(false);
        setInterimTranscript("");
    }, [clearTimers]);

    // ── Toggle ──
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    // ── TTS: Speak text using Edge TTS API ──
    const speak = useCallback(async (text: string, lang?: string) => {
        if (synthRef.current) {
            (synthRef.current as any).pause?.();
        }

        if (!text.trim()) return;

        setIsSpeaking(true);

        try {
            const isTamil = /[\u0B80-\u0BFF]/.test(text) || language === 'ta-IN' || lang === 'ta-IN';
            const voice = isTamil ? 'ta-IN-PallaviNeural' : 'en-US-AriaNeural';

            const response = await fetch('/api/tts/edge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice })
            });

            if (!response.ok) {
                throw new Error("TTS generation failed");
            }

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);

            const audio = new Audio(audioUrl);
            setActiveAudioElement(audio);
            synthRef.current = audio as any;

            audio.onended = () => {
                setIsSpeaking(false);
                setActiveAudioElement(null);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                console.error("Audio playback error");
                setIsSpeaking(false);
                setActiveAudioElement(null);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (err) {
            console.error("Text To Speech Error:", err);
            setIsSpeaking(false);
        }
    }, [language]);

    // ── Stop Speaking ──
    const stopSpeaking = useCallback(() => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        if (synthRef.current) {
            try {
                (synthRef.current as any).pause();
                (synthRef.current as any).currentTime = 0;
            } catch (e) {
                console.error("Error stopping audio:", e);
            }
        }
        setIsSpeaking(false);
    }, []);

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            clearTimers();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch { }
            }
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [clearTimers]);

    return {
        isListening,
        isSupported,
        isSpeaking,
        activeStream,
        activeAudioElement,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        toggleListening,
        speak,
        stopSpeaking,
        setLanguage,
        language,
    };
}
