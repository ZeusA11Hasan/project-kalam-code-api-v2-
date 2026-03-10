"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TutorLayoutProps {
    whiteboardPanel: React.ReactNode;
    chatPanel: React.ReactNode;
    children: React.ReactNode; // Input Bar
}

/**
 * TutorLayout
 * Handles the Split Screen (Whiteboard Left, Chat Right)
 * and Mobile Drawer logic.
 */
export default function TutorLayout({ whiteboardPanel, chatPanel, children }: TutorLayoutProps) {
    // Simple Split Layout
    // Left: Whiteboard (60-70%)
    // Right: Chat (30-40%)

    return (
        <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden">
            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* LEFT: WHITEBOARD PANEL (Hidden on mobile via generic hidden md:flex) */}
                <div className="hidden md:flex flex-1 relative border-r border-white/5 bg-gray-950/50">
                    {whiteboardPanel}
                </div>

                {/* RIGHT: CHAT PANEL */}
                <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col bg-black/40 backdrop-blur-xl relative z-10">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {chatPanel}
                    </div>

                    {/* Input Area (Children) */}
                    <div className="p-4 border-t border-white/5 bg-black/60">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
