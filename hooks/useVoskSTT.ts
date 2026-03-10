"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

// Types for Vosk
interface VoskResult {
    text: string;
    result?: Array<{
        word: string;
        start: number;
        end: number;
        conf: number;
    }>;
}

interface VoskPartialResult {
    partial: string;
}

interface UseVoskSTTOptions {
    modelUrl?: string;
    sampleRate?: number;
    onResult?: (text: string, isFinal: boolean) => void;
    onError?: (error: Error) => void;
    debug?: boolean;
}

interface UseVoskSTTReturn {
    isLoading: boolean;
    isListening: boolean;
    isModelLoaded: boolean;
    transcript: string;
    partialTranscript: string;
    error: string | null;
    startListening: () => Promise<void>;
    stopListening: () => void;
    loadModel: () => Promise<void>;
}

// CDN URLs for Vosk WASM
const VOSK_CDN = "https://cdn.jsdelivr.net/npm/vosk-browser@0.0.8/dist/";
const DEFAULT_MODEL_URL = "/vosk-model";

/**
 * React Hook for Vosk WASM Speech-to-Text
 * 
 * Features:
 * - Offline recognition (no API costs)
 * - Works in all modern browsers
 * - Real-time streaming transcription
 * - Supports pause/resume
 */
export function useVoskSTT(options: UseVoskSTTOptions = {}): UseVoskSTTReturn {
    const {
        modelUrl = DEFAULT_MODEL_URL,
        sampleRate = 16000,
        onResult,
        onError,
        debug = false,
    } = options;

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Refs for persistent objects
    const recognizerRef = useRef<any>(null);
    const modelRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Debug logger
    const log = useCallback((...args: any[]) => {
        if (debug) {
            console.log('[Vosk STT]', ...args);
        }
    }, [debug]);

    // Load Vosk library dynamically
    const loadVoskLibrary = useCallback(async () => {
        if (typeof window === 'undefined') return null;

        // Check if already loaded
        if ((window as any).Vosk) {
            return (window as any).Vosk;
        }

        log('Loading Vosk library from CDN...');

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${VOSK_CDN}vosk.js`;
            script.async = true;
            script.onload = () => {
                log('Vosk library loaded');
                resolve((window as any).Vosk);
            };
            script.onerror = () => {
                reject(new Error('Failed to load Vosk library'));
            };
            document.head.appendChild(script);
        });
    }, [log]);

    // Load Vosk model
    const loadModel = useCallback(async () => {
        if (isModelLoaded || modelRef.current) {
            log('Model already loaded');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const Vosk = await loadVoskLibrary();
            if (!Vosk) {
                throw new Error('Vosk library not available');
            }

            log('Creating Vosk model...');

            // Create model from URL
            const model = await Vosk.createModel(modelUrl);
            modelRef.current = model;

            // Create recognizer
            const recognizer = new model.KaldiRecognizer(sampleRate);

            // Set up result handlers
            recognizer.on('result', (message: VoskResult) => {
                const text = message.text?.trim();
                if (text) {
                    log('Final result:', text);
                    setTranscript(prev => prev + ' ' + text);
                    setPartialTranscript('');
                    onResult?.(text, true);
                }
            });

            recognizer.on('partialresult', (message: VoskPartialResult) => {
                const partial = message.partial?.trim();
                if (partial) {
                    log('Partial:', partial);
                    setPartialTranscript(partial);
                    onResult?.(partial, false);
                }
            });

            recognizerRef.current = recognizer;
            setIsModelLoaded(true);
            log('Model loaded successfully');

        } catch (err: any) {
            const errorMsg = `Failed to load Vosk model: ${err.message}`;
            log('Error:', errorMsg);
            setError(errorMsg);
            onError?.(err);
        } finally {
            setIsLoading(false);
        }
    }, [isModelLoaded, loadVoskLibrary, modelUrl, sampleRate, onResult, onError, log]);

    // Start listening
    const startListening = useCallback(async () => {
        if (isListening) {
            log('Already listening');
            return;
        }

        setError(null);

        try {
            // Load model if not loaded
            if (!isModelLoaded) {
                await loadModel();
            }

            if (!recognizerRef.current) {
                throw new Error('Recognizer not initialized');
            }

            log('Requesting microphone access...');

            // Get microphone stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: sampleRate,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            mediaStreamRef.current = stream;
            log('Microphone access granted');

            // Create audio context
            const audioContext = new AudioContext({ sampleRate });
            audioContextRef.current = audioContext;

            // Create source from microphone
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            // Create processor for audio data
            // Note: ScriptProcessorNode is deprecated but still widely supported
            // For production, use AudioWorkletNode
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);

                // Convert Float32Array to Int16Array for Vosk
                const int16Data = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)));
                }

                // Feed audio to recognizer
                if (recognizerRef.current) {
                    recognizerRef.current.acceptWaveform(int16Data);
                }
            };

            // Connect: source -> processor -> destination
            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsListening(true);
            log('Listening started');

        } catch (err: any) {
            let errorMsg = 'Failed to start listening';

            if (err.name === 'NotAllowedError') {
                errorMsg = 'Microphone access denied. Please allow microphone access.';
            } else if (err.name === 'NotFoundError') {
                errorMsg = 'No microphone found. Please connect a microphone.';
            } else {
                errorMsg = err.message;
            }

            log('Error:', errorMsg);
            setError(errorMsg);
            onError?.(err);
        }
    }, [isListening, isModelLoaded, loadModel, sampleRate, onError, log]);

    // Stop listening
    const stopListening = useCallback(() => {
        log('Stopping listening...');

        // Stop processor
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        // Stop source
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Stop media stream tracks
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Get final result from recognizer
        if (recognizerRef.current) {
            const finalResult = recognizerRef.current.finalResult();
            if (finalResult?.text?.trim()) {
                setTranscript(prev => prev + ' ' + finalResult.text);
                onResult?.(finalResult.text, true);
            }
        }

        setIsListening(false);
        setPartialTranscript('');
        log('Listening stopped');
    }, [onResult, log]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListening();

            if (recognizerRef.current) {
                recognizerRef.current.remove();
                recognizerRef.current = null;
            }

            if (modelRef.current) {
                modelRef.current.terminate();
                modelRef.current = null;
            }
        };
    }, [stopListening]);

    return {
        isLoading,
        isListening,
        isModelLoaded,
        transcript,
        partialTranscript,
        error,
        startListening,
        stopListening,
        loadModel,
    };
}

export default useVoskSTT;
