"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ───────────────────────────────────────────
export type SpeechLanguage = "en-IN" | "ta-IN" | "hi-IN";

interface UseWebSpeechOptions {
    language?: SpeechLanguage;
    continuous?: boolean;
    onFinalTranscript?: (text: string) => void;
    onInterimTranscript?: (text: string) => void;
    onError?: (error: string) => void;
}

interface UseWebSpeechReturn {
    isListening: boolean;
    isSupported: boolean;
    isSpeaking: boolean;
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

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

    // ── Check browser support ──
    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);
    }, []);

    // ── Start Listening ──
    const startListening = useCallback(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            onError?.("Web Speech API not supported. Please use Chrome!");
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log("[WebSpeech] 🎤 Listening started");
            setIsListening(true);
            setTranscript("");
            setInterimTranscript("");
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
            }

            if (final) {
                const trimmed = final.trim();
                console.log("[WebSpeech] ✅ Final transcript:", trimmed);
                setTranscript(trimmed);
                setInterimTranscript("");
                onFinalTranscript?.(trimmed);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("[WebSpeech] ❌ Error:", event.error);
            // Don't report "aborted" as an error (happens on manual stop)
            if (event.error !== "aborted") {
                onError?.(event.error);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            console.log("[WebSpeech] 🛑 Listening ended");
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [language, continuous, onFinalTranscript, onInterimTranscript, onError]);

    // ── Stop Listening ──
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
        setInterimTranscript("");
    }, []);

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
        // Cancel any ongoing speech
        if (synthRef.current) {
            (synthRef.current as any).pause?.();
        }

        if (!text.trim()) return;

        setIsSpeaking(true);

        try {
            // Auto-detect Tamil script: \u0B80-\u0BFF is the Tamil Unicode block
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
            synthRef.current = audio as any;

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                console.error("Audio playback error");
                setIsSpeaking(false);
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
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch { }
            }
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    return {
        isListening,
        isSupported,
        isSpeaking,
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
