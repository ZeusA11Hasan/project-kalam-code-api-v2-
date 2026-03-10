"use client"

import { MessageBubble, Message } from "./MessageBubble"

interface ChatPanelProps {
    messages?: Message[]
    isSpeaking?: boolean
}

export function ChatPanel({ messages = [], isSpeaking = false }: ChatPanelProps) {
    return (
        <div className="flex-1 space-y-4 overflow-y-auto p-4 max-h-full">
            {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center pb-20">
                    <div className="text-center text-white/50">
                        <p className="text-lg font-medium">Welcome to AI Tutor</p>
                        <p className="mt-2 text-sm">Start a conversation to begin learning</p>
                    </div>
                </div>
            ) : (
                messages.map((message, index) => {
                    const isLast = index === messages.length - 1;
                    const animateSpeech = isSpeaking && isLast && message.role === "assistant";

                    return (
                        <MessageBubble
                            key={message.id || index}
                            message={message}
                            isSpeaking={animateSpeech}
                        />
                    );
                })
            )}
        </div>
    )
}
