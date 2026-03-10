"use client";

import { useState, useCallback } from 'react';
import TutorLayout from '@/components/tutor/TutorLayout';
import PythonIDE from '@/components/PythonIDE';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatInput } from '@/components/chat/ChatInput';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function TutorClient() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Voice Mode State
    const [voiceMode, setVoiceMode] = useState(false);
    const { speak, cancel, isSpeaking } = useTextToSpeech();

    const handleSend = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessageContent = text.trim();
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessageContent
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        cancel(); // Stop any current speech

        try {
            const response = await fetch('/api/chat/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    rag_chunks: [],
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // 1. Handle Whiteboard Mode (Disabled or redirected to code)
                if (data.mode === 'whiteboard' && data.whiteboard) {
                    const aiContent = "I've prepared a coding exercise for you.";

                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: aiContent
                    }]);

                    if (voiceMode) speak(aiContent);

                } else {
                    // 2. Handle standard Chat Mode
                    let aiContent = data.chat || data.answer || data.text || 'I received your message.';

                    // Try to extract TTS JSON if present (legacy support)
                    let cleanText = aiContent;
                    try {
                        const jsonMatch = aiContent.match(/\{[\s\S]*"tts"[\s\S]*\}/);
                        if (jsonMatch) {
                            const jsonContent = JSON.parse(jsonMatch[0]);
                            if (jsonContent.tts && jsonContent.tts.text) {
                                cleanText = jsonContent.tts.text;
                                aiContent = cleanText;
                            }
                        }
                    } catch (parseError) {
                        console.error("Error parsing TTS JSON:", parseError);
                    }

                    // Trigger STT ONLY if Voice Mode is active
                    if (voiceMode) {
                        speak(cleanText);
                    }

                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: aiContent
                    }]);

                    // Legacy: Check for 'whiteboardBlocks' if API still sends it (backup)
                    // (Whiteboard logic disabled)
                }

            } else {
                const errorMsg = 'I\'m here to help! Ask me about Physics, Chemistry, Maths, or Biology.';
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: errorMsg
                }]);
                if (voiceMode) speak(errorMsg);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const crashMsg = 'Welcome! I\'m your AI Tutor. Ask me anything about JEE, NEET, or NCERT!';
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: crashMsg
            }]);
            if (voiceMode) speak(crashMsg);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages, speak, cancel, voiceMode]);

    const handleStop = useCallback(() => {
        setIsLoading(false);
        cancel(); // Stop speech on stop
    }, [cancel]);

    const handleToggleVoiceMode = useCallback(() => setVoiceMode(prev => !prev), []);

    // Phase 5: Voice Bridge
    const handleBoardSpeak = useCallback((text: string) => {
        cancel(); // Always interrupt previous
        speak(text);
    }, [cancel, speak]);

    return (
        <TutorLayout
            whiteboardPanel={
                <PythonIDE />
            }
            chatPanel={
                <ChatPanel
                    messages={messages}
                    // @ts-ignore - We need to update ChatPanel to accept isSpeaking
                    isSpeaking={isSpeaking}
                />
            }
        >
            {/* We pass ChatInput as children to TutorLayout */}
            {/* 🎨 Input Wrapper: Max Width + Centering + Footer */}
            <div className="w-full max-w-[680px] mx-auto pb-[10px]">
                <ChatInput
                    onSendMessage={handleSend}
                    onStop={handleStop}
                    voiceMode={voiceMode}
                    onToggleVoiceMode={handleToggleVoiceMode}
                    isSpeaking={isSpeaking}
                    placeholder="Ask me anything about Physics, Chemistry, Maths..."
                    disabled={isLoading}
                />

            </div>
        </TutorLayout>
    );
}
