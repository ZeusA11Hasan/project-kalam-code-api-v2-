import { useCallback, useRef, useState } from 'react';

interface TTSOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
}

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
        // Cancel any ongoing speech
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsSpeaking(false);
        }

        if (!text.trim()) return;

        setIsSpeaking(true);

        try {
            // Auto-detect Tamil script: \u0B80-\u0BFF is the Tamil Unicode block
            const isTamil = /[\u0B80-\u0BFF]/.test(text);
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
            audioRef.current = audio;

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
    }, []);

    const cancel = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsSpeaking(false);
        }
    }, []);

    return {
        speak,
        cancel,
        isSpeaking,
        // Using Edge TTS on backend avoids reliance on browser Web Speech API for synthesis
        hasSupport: true
    };
};
