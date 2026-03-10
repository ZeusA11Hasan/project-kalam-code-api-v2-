"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useMotionValue, useTransform, animate, LayoutGroup } from "framer-motion"
import { Code2, Calculator, Home, MessageSquare, Settings, BookOpen, User, Paperclip, Mic, Send, Sparkles, Menu, X, ChevronRight, PanelLeftClose, PanelLeft, Bot, Check, ArrowDown, Copy, RefreshCw, Share2, BrainCircuit, Gamepad2 } from "lucide-react"
import { SharePopover } from "@/components/ui/SharePopover"
import ReactMarkdown from 'react-markdown'
import { FeatureCard } from "@/components/FeatureCard"
import { ChatLayout, ChatPanel, Message, FloatingDock, ModePanel, sectionItems } from "@/components/chat"
import { FlipWords } from "@/components/ui/flip-words"
import HeroTitle from "@/components/HeroTitle"
import TitleSection from "@/components/TitleSection"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import PythonIDE from "@/components/PythonIDE"
import { PromptInputBox } from "@/components/ui/ai-prompt-box"
import { ChatMorphBar } from "@/components/ui/ChatMorphBar"
import { VoiceInputButton } from "@/components/ui/VoiceInputButton"
import { NavBar } from "@/components/ui/tubelight-navbar"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import type { WhiteboardData } from "@/types/whiteboard"
import { parseWhiteboardBlocks } from "@/lib/whiteboard/parseWhiteboard"
import KineticDotsLoader from "@/components/ui/kinetic-dots-loader"
import { AIAssistantInterface } from "@/components/ui/ai-assistant-interface"
import { CallWaveform } from "@/components/ui/CallWaveform"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { TextRotate } from "@/components/ui/text-rotate"
import { useWebSpeech } from "@/lib/hooks/use-web-speech"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase/browser-client"
import LoginPage from "@/components/auth/LoginPage"
import { SidebarToggleIcon } from "@/components/ui/sidebar-toggle-icon"


const NewLogo = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={className}
    >
        <path fill="currentColor" fillRule="evenodd" d="M13.732 1.91a3.75 3.75 0 0 0-3.515.085L4.162 5.401A3.75 3.75 0 0 0 2.25 8.67v6.66a3.75 3.75 0 0 0 1.912 3.27l6.055 3.406a3.75 3.75 0 0 0 3.515.085l3.05-1.525a1.75 1.75 0 1 0-1.565-3.13l-3.05 1.525a.25.25 0 0 1-.234-.006l-6.056-3.406a.25.25 0 0 1-.127-.218V8.67a.25.25 0 0 1 .127-.218l6.056-3.406a.25.25 0 0 1 .234-.006l3.05 1.525a1.75 1.75 0 1 0 1.566-3.13l-3.05-1.525Zm-1.874 6.076a1 1 0 0 1-.344 1.372L9.5 10.566V13a1 1 0 0 1-2 0V9.434l2.986-1.791a1 1 0 0 1 1.371.343ZM18 7.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" clipRule="evenodd" />
    </svg>
)

// Dock items for the floating dock navbar
const dockItems = [
    { title: "Home", icon: <Home className="size-full text-white" />, href: "/" },
    { title: "Game", icon: <Gamepad2 className="size-full text-white" />, href: "/game" },
    { title: "Library", icon: <BookOpen className="size-full text-white" />, href: "/library" },
    { title: "Profile", icon: <User className="size-full text-white" />, href: "/profile" },
    { title: "Settings", icon: <Settings className="size-full text-white" />, href: "/settings" },
]

const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Features', url: '#features', icon: Sparkles },
    { name: 'Library', url: '#library', icon: BookOpen },
    { name: 'Pricing', url: '#pricing', icon: Calculator },
    { name: 'Profile', url: '#profile', icon: User }
]

export default function HomePage() {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentMode, setCurrentMode] = useState<string | null>(null)
    const [isChatMode, setIsChatMode] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [isModeOpen, setIsModeOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isMobileLoading, setIsMobileLoading] = useState(true)
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(true)
    const count = useMotionValue(0)
    const rounded = useTransform(count, Math.round)
    const displayText = useTransform(rounded, (latest) => latest + "%")

    // Clean whiteboard - ready for AI content
    const [whiteboardData, setWhiteboardData] = useState<WhiteboardData>({
        width: 800,
        height: 550,
        coordinateSystem: 'absolute',
        elements: []
    })

    // AI-generated code for IDE injection
    const [ideCode, setIdeCode] = useState<string | undefined>(undefined)

    const [heroIndex, setHeroIndex] = useState(0)

    // Thinking phrases for AI typing indicator
    const thinkingPhrases = [
        "Agent is thinking...",
        "Processing your request...",
        "Analyzing the data...",
        "Generating response...",
        "Almost there...",
    ]
    const [thinkingIndex, setThinkingIndex] = useState(0)
    const [isAILoading, setIsAILoading] = useState(false)
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isIDEHovered, setIsIDEHovered] = useState(false);
    const [ideLanguage, setIdeLanguage] = useState<'python' | 'sql'>('python');
    const [isCallActive, setIsCallActive] = useState(false);
    const [voiceModeEnabled, setVoiceModeEnabled] = useState(false); // When true, AI responses are spoken aloud
    const abortControllerRef = useRef<AbortController | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { user, isLoading: isAuthLoading } = useAuth();
    const [userStats, setUserStats] = useState<{ xp: number; level: number; streak_count: number } | null>(null);

    // Fetch User Stats from Supabase
    useEffect(() => {
        if (!user) return;
        const fetchStats = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('xp, level, streak_count')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    // Row doesn't exist yet — create it via upsert (ignoreDuplicates protects existing data)
                    console.warn("[Stats] User row not found, creating default:", error.message);
                    const { error: upsertError } = await supabase
                        .from('users')
                        .upsert(
                            { id: user.id, email: user.email, xp: 0, level: 1, streak_count: 0 },
                            { onConflict: 'id', ignoreDuplicates: true }
                        );
                    if (upsertError) {
                        console.error("[Stats] Failed to create user row:", upsertError.message);
                    }
                    setUserStats({ xp: 0, level: 1, streak_count: 0 });
                } else if (data) {
                    setUserStats(data);
                }
            } catch (err: any) {
                console.error("[Stats] Unexpected error fetching stats:", err.message || err);
            }
        };
        fetchStats();
    }, [user]);

    // 1. Initial Loading State
    useEffect(() => {
        const timeout = setTimeout(() => setIsMobileLoading(false), 2000)
        return () => clearTimeout(timeout)
    }, [])




    // ── Student Profile — Persistent Memory ─────────────────
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const studentId = user?.id || 'default'; // Map to Supabase Auth ID
    const sessionTopicsRef = useRef<Set<string>>(new Set());

    // Load student profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetch(`/api/student?id=${studentId}`);
                if (res.ok) {
                    const data = await res.json();
                    setStudentProfile(data.profile);
                    console.log('[Profile] Loaded student profile:', data.profile?.display_name, '| Sessions:', data.sessionCount);
                }
            } catch (err) {
                console.warn('[Profile] Could not load student profile:', err);
            }
        };
        loadProfile();
    }, []);

    // Get dynamic greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };
    const studentName = studentProfile?.display_name || user?.email?.split('@')[0] || 'Learner';

    // Save session summary on unmount / before unload
    const saveSessionSummary = useRef(async () => {
        if (messages.length < 2) return; // Need at least one exchange
        try {
            const topics = Array.from(sessionTopicsRef.current);
            const lastMessages = messages.slice(-4).map(m => m.content).join(' ');
            await fetch('/api/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    session: {
                        session_summary: `Covered ${topics.length > 0 ? topics.join(', ') : 'general discussion'}. Last exchange: ${lastMessages.slice(0, 200)}`,
                        topics_covered: topics,
                        concepts_mastered: [],
                        concepts_needing_revision: [],
                        suggested_next_topic: '',
                        student_confidence_signal: 'medium',
                        topic_stack: topics,
                    },
                }),
            });
            console.log('[Profile] Session saved successfully');
        } catch (err) {
            console.warn('[Profile] Could not save session:', err);
        }
    });

    // Keep the ref up to date with latest messages
    useEffect(() => {
        saveSessionSummary.current = async () => {
            if (messages.length < 2) return;
            try {
                const topics = Array.from(sessionTopicsRef.current);
                const lastMessages = messages.slice(-4).map(m => m.content).join(' ');
                await fetch('/api/student', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId,
                        session: {
                            session_summary: `Covered ${topics.length > 0 ? topics.join(', ') : 'general discussion'}. Last exchange: ${lastMessages.slice(0, 200)}`,
                            topics_covered: topics,
                            concepts_mastered: [],
                            concepts_needing_revision: [],
                            suggested_next_topic: '',
                            student_confidence_signal: 'medium',
                            topic_stack: topics,
                        },
                    }),
                });
                console.log('[Profile] Session saved successfully');
            } catch (err) {
                console.warn('[Profile] Could not save session:', err);
            }
        };
    }, [messages]);

    // Auto-save session before page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Use sendBeacon for reliable fire-and-forget on unload
            if (messages.length >= 2) {
                const topics = Array.from(sessionTopicsRef.current);
                const lastMessages = messages.slice(-4).map(m => m.content).join(' ');
                navigator.sendBeacon('/api/student', JSON.stringify({
                    studentId,
                    session: {
                        session_summary: `Covered ${topics.length > 0 ? topics.join(', ') : 'general discussion'}. Last exchange: ${lastMessages.slice(0, 200)}`,
                        topics_covered: topics,
                        concepts_mastered: [],
                        concepts_needing_revision: [],
                        suggested_next_topic: '',
                        student_confidence_signal: 'medium',
                        topic_stack: topics,
                    },
                }));
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [messages]);

    // ── Web Speech API Integration ──────────────────
    const webSpeech = useWebSpeech({
        language: "en-IN",
        continuous: false,
        onFinalTranscript: (text) => {
            console.log("[Voice] Final transcript received:", text);
            if (text.trim()) {
                setVoiceModeEnabled(true); // Enable TTS for this conversation turn
                handleSend(text.trim());
            }
        },
        onError: (error) => {
            console.error("[Voice] STT Error:", error);
        }
    });

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsAILoading(false)
    }

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isAILoading && messages.length > 0 && messages[messages.length - 1].role === "user") {
            interval = setInterval(() => {
                setThinkingIndex((prev) => (prev + 1) % thinkingPhrases.length)
            }, 3000)
        }
        return () => clearInterval(interval)
    }, [isAILoading, messages, thinkingPhrases.length])

    // Auto-scroll to latest message properly
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isAILoading]);

    useEffect(() => {
        // Only run on mobile - check window width
        const checkMobile = () => {
            if (window.innerWidth < 768) {
                const animation = animate(count, 100, { duration: 5 })

                const timer = setTimeout(() => {
                    setIsMobileLoading(false)
                }, 5000)

                return () => {
                    animation.stop()
                    clearTimeout(timer)
                }
            } else {
                setIsMobileLoading(false)
            }
        }

        checkMobile()
    }, [count])

    const [panelWidth, setPanelWidth] = useState(50)
    const [isResizing, setIsResizing] = useState(false)

    // Robust Resizing Engine (Built from scratch)
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Calculate relative width from right edge
            const mouseX = e.clientX;
            const windowWidth = window.innerWidth;

            // Calculate percentage (how much space the RIGHT panel takes)
            let percentage = ((windowWidth - mouseX) / windowWidth) * 100;

            // Clamp between 30% and 75% for better usability
            const clampedWidth = Math.min(Math.max(percentage, 30), 75);

            setPanelWidth(clampedWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.classList.remove('resizing-active');
        };

        // Global listeners for fluid drag experience
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.classList.add('resizing-active');

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('resizing-active');
        };
    }, [isResizing]);

    // Force body overflow hidden to prevent page scroll
    useEffect(() => {
        if (isChatMode) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
        }
    }, [isChatMode]);

    // Browser back button support for exiting chat mode
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // If we're in chat mode and user pressed back, exit chat mode
            if (isChatMode && (!event.state || !event.state.chatMode)) {
                setIsChatMode(false)
                setMessages([])
            }
        }

        window.addEventListener('popstate', handlePopState)

        return () => {
            window.removeEventListener('popstate', handlePopState)
        }
    }, [isChatMode])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const handleSend = async (message: string) => {
        if (!user) {
            router.push('/login');
            return;
        }
        const trimmedMessage = message.trim();
        if (!trimmedMessage || isAILoading) return;

        // Set loading immediately to block duplicate sends
        setIsAILoading(true);
        console.log("Message send:", trimmedMessage);

        const newMessage: Message = {
            id: Date.now().toString(),
            content: trimmedMessage,
            role: "user",
            timestamp: new Date()
        }

        // Functional state update to prevent race conditions
        setMessages((prev) => [...prev, newMessage]);

        // Trigger chat mode on first message
        if (!isChatMode) {
            window.history.pushState({ chatMode: true }, '', window.location.href);
            setIsChatMode(true);
        }

        await processAICall([...messages, newMessage]);
    };

    const processAICall = async (currentMessages: Message[]) => {
        setIsAILoading(true);
        console.log("API call start");
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('/api/ollama', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    messages: currentMessages,
                    mode: isCallActive ? 'teach' : undefined,
                    language: isWhiteboardOpen ? ideLanguage : 'python',
                    studentId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("API response success:", data);
                const aiContent = data.explanation || data.reply || 'I received your message.';

                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: aiContent,
                    role: "assistant",
                    timestamp: new Date()
                }
                setMessages((prev) => [...prev, aiMessage]);

                // 🔊 Auto-speak AI response if call is active or voice mode is enabled
                if (isCallActive || voiceModeEnabled) {
                    webSpeech.speak(aiContent);
                    setVoiceModeEnabled(false); // Reset after speaking
                }

                if (data.code && data.code.trim()) {
                    setIdeCode(data.code);
                    setIsWhiteboardOpen(true);
                }

                // Track topics mentioned in this session
                const topicKeywords = ['loop', 'function', 'variable', 'string', 'list', 'dict', 'class', 'array',
                    'conditional', 'if else', 'for loop', 'while', 'recursion', 'sorting', 'SQL', 'SELECT',
                    'JOIN', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'print', 'input', 'file', 'exception',
                    'try except', 'module', 'import', 'tuple', 'set', 'boolean', 'operator', 'method'];
                const userMsg = currentMessages[currentMessages.length - 1]?.content?.toLowerCase() || '';
                for (const kw of topicKeywords) {
                    if (userMsg.includes(kw.toLowerCase())) {
                        sessionTopicsRef.current.add(kw);
                    }
                }
            } else {
                console.warn("API response error:", response.status);
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: 'Sorry, I encountered an error. Please try again.',
                    role: "assistant",
                    timestamp: new Date()
                }
                setMessages((prev) => [...prev, errorMessage]);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Generation stopped by user');
                setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    content: 'Generation stopped.',
                    role: "assistant",
                    timestamp: new Date()
                }]);
            } else {
                console.error('API call error catch:', error);
                setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    content: 'Connection error. Please check your network.',
                    role: "assistant",
                    timestamp: new Date()
                }]);
            }
        } finally {
            setIsAILoading(false);
        }
    };

    const handleRetry = () => {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length > 0) {
            const lastUserMessage = userMessages[userMessages.length - 1];
            console.log("Retrying last message:", lastUserMessage.content);
            processAICall(messages);
        }
    };

    const handleFullScreenSend = () => {
        if (inputValue.trim()) {
            handleSend(inputValue.trim())
            setInputValue("")
        }
    }

    const handleEndSession = async () => {
        if (messages.length < 2) {
            setIsChatMode(false);
            setMessages([]);
            return;
        }

        setIsAILoading(true);
        const userMsg: Message = {
            id: Date.now().toString(),
            content: "Please wrap up our session.",
            role: "user",
            timestamp: new Date()
        };
        const currentMessages = [...messages, userMsg];
        setMessages(currentMessages);

        try {
            const response = await fetch('/api/ollama', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages,
                    mode: 'wrap_up',
                    studentId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    content: data.explanation || "Session complete. Your progress has been saved!",
                    role: "assistant",
                    timestamp: new Date()
                };
                setMessages((prev) => [...prev, aiMsg]);
            }
        } catch (err) {
            console.error("End Session Error:", err);
        } finally {
            setIsAILoading(false);
            // Delay exit slightly so student can see the summary message
            setTimeout(() => {
                setIsChatMode(false);
                setMessages([]);
            }, 3000);
        }
    };

    const handleIDEAction = async (action: string, code: string, output: string) => {
        // Trigger chat mode
        if (!isChatMode) {
            window.history.pushState({ chatMode: true }, '', window.location.href)
            setIsChatMode(true)
        }

        // Add a "system" style user message to the chat
        const userMsg: Message = {
            id: Date.now().toString(),
            content: action === 'review' ? "Please review my code." : "Teach me about this code.",
            role: "user",
            timestamp: new Date()
        }

        const currentMessages = [...messages, userMsg]
        setMessages(currentMessages)
        setIsAILoading(true)
        abortControllerRef.current = new AbortController()

        try {
            const response = await fetch('/api/ollama', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    messages: currentMessages,
                    mode: action,
                    code,
                    language: ideLanguage,
                    output: output.startsWith('>') ? "" : output,
                    error: output.toLowerCase().includes("error") ? output : "",
                    studentId,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                const aiContent = data.explanation || data.review || data.reply || 'I analyzed your code.'

                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    content: aiContent,
                    role: "assistant",
                    timestamp: new Date()
                }
                setMessages((prev) => [...prev, aiMsg])

                // If the AI suggests corrected or optimized code, inject it back to the left side
                if (data.code || data.optimizedCode) {
                    setIdeCode(data.code || data.optimizedCode)
                }

                // 🔊 Auto-speak AI response if call is active
                if (isCallActive) {
                    webSpeech.speak(aiContent);
                }
            } else {
                setMessages((prev) => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Sorry, I couldn't process the code analysis right now.",
                    timestamp: new Date()
                }])
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('IDE Action stopped by user')
                const stopMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: 'Analysis stopped.',
                    role: "assistant",
                    timestamp: new Date()
                }
                setMessages((prev) => [...prev, stopMessage])
            } else {
                console.error('IDE Action error:', error)
            }
        } finally {
            setIsAILoading(false)
        }
    }

    const handleNewChat = () => {
        setIsChatMode(true);
        setMessages([]);
        window.history.pushState({ chatMode: true }, '', window.location.href);
    };

    if (isAuthLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-transparent">
                <KineticDotsLoader />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile Loading Animation */}
            <AnimatePresence>
                {isMobileLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black md:hidden"
                    >
                        <motion.h1 className="text-6xl font-bold text-white">
                            {displayText}
                        </motion.h1>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Dock - Left Side Vertical (always visible on desktop, hidden on mobile) */}
            <div className="fixed left-3 top-1/2 z-[60] -translate-y-1/2 hidden md:block">
                <FloatingDock
                    items={dockItems}
                    onNewChat={handleNewChat}
                    onSectionSelect={(section) => console.log("Section selected:", section)}
                />
            </div>

            {/* Landing Content - Fades out when chat mode is active */}
            <AnimatePresence mode="wait">
                {!isChatMode && (
                    <motion.div
                        key="landing-wrapper"
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                            opacity: 0,
                            y: -20,
                            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                        }}
                        className="flex flex-1 flex-col relative z-20"
                    >
                        {/* Seamless Black Glass Overlay */}
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-xl pointer-events-none z-10" />

                        {/* Top Gradient for subtle depth */}
                        <div className="fixed inset-0 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />

                        {/* Header Section */}
                        <NavBar items={navItems} />

                        {/* Background Radial Gradients */}
                        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute left-1/4 top-20 size-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
                            <div className="absolute right-1/4 top-40 size-[500px] rounded-full bg-teal-500/5 blur-3xl" />
                            <div className="absolute bottom-20 left-1/3 size-[400px] rounded-full bg-emerald-500/5 blur-3xl" />
                        </div>

                        {/* Main Content Container */}
                        <div className="flex flex-1 flex-col items-center justify-center gap-6 md:gap-10 px-6 md:px-20 pb-12 pt-[15vh] md:pt-[18vh]">
                            {/* 1. Personalized Greeting (Hook) */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-center z-20"
                            >

                                <h2 className="text-[25px] md:text-[32px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/30 mb-8 md:mb-12 font-darker-grotesque">
                                    Welcome back
                                </h2>
                                <h1 className="text-[75px] md:text-[125px] font-bold tracking-tight text-white mb-2 font-darker-grotesque leading-[0.9]">
                                    {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-[length:200%_auto] animate-gradient font-darker-grotesque">{studentName}</span>
                                </h1>
                            </motion.div>

                            {/* 2. Hero Action (Context) */}
                            <div className="w-full flex flex-col items-center justify-center z-20 pointer-events-none mt-8 md:mt-16">
                                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
                                    <span className="opacity-70 text-[24px] sm:text-[36px] md:text-[48px] font-light text-white/80 tracking-[0.1em] md:tracking-[0.15em] uppercase font-darker-grotesque leading-tight">
                                        Ask me anything
                                    </span>
                                    <div className="flex items-center min-w-[100px] md:min-w-[160px] justify-center md:justify-start text-center md:text-left">
                                        <TextRotate
                                            texts={["Programming", "Mathematics", "AI", "Literature"]}
                                            mainClassName="text-cyan-400 text-[24px] sm:text-[36px] md:text-[48px] font-semibold tracking-wide font-darker-grotesque leading-tight"
                                            staggerFrom="last"
                                            initial={{ y: "100%", opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: "-120%", opacity: 0 }}
                                            staggerDuration={0.025}
                                            splitBy="characters"
                                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                            rotationInterval={3000}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. The Premium Action Area */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full max-w-3xl z-20 mt-4 px-2 md:px-0"
                            >
                                <ChatMorphBar
                                    onSend={handleSend}
                                    isLoading={isAILoading}
                                    isCallActive={isCallActive}
                                    isListening={webSpeech.isListening}
                                    isSpeaking={webSpeech.isSpeaking}
                                    interimTranscript={webSpeech.interimTranscript}
                                    onMicToggle={webSpeech.toggleListening}
                                    onStartCall={() => {
                                        setIsCallActive(true);
                                        if (!webSpeech.isListening) {
                                            webSpeech.startListening();
                                        }
                                    }}
                                    onEndCall={() => {
                                        setIsCallActive(false);
                                        abortControllerRef.current?.abort();
                                        if (webSpeech.isListening) webSpeech.stopListening();
                                        webSpeech.stopSpeaking();
                                    }}
                                    onStop={() => {
                                        abortControllerRef.current?.abort();
                                        webSpeech.stopSpeaking();
                                    }}
                                    placeholder="Type a subject or paste a problem..."
                                    className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full-Screen Chat Overlay - Appears when chat mode is active */}
            <AnimatePresence>
                {isChatMode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-1 pt-1 pb-3 md:px-4 md:pt-4 md:pb-6 md:pl-[120px]"
                    >
                        {/* Background Layer with Radial Gradient */}
                        <div className="bg-gradient-radial absolute inset-0 from-cyan-900/10 via-black/40 to-black/60 backdrop-blur-sm" />

                        {/* Subtle Glowing Blobs */}
                        <div className="absolute left-1/4 top-1/4 size-96 animate-pulse rounded-full bg-cyan-500/5 blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 size-80 animate-pulse rounded-full bg-teal-500/5 blur-3xl" style={{ animationDelay: "1s" }} />

                        {/* Main Split Container - Chat (Left) + Whiteboard (Right) */}
                        <div className="relative flex h-full w-full gap-0 md:h-[98vh] max-h-[98vh]">

                            {/* Chat Container — Now consistently on the left */}
                            <motion.div
                                key="chat-panel"
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{
                                    opacity: 1,
                                    scale: isResizing ? 0.985 : (isWhiteboardOpen ? 0.99 : 1),
                                    y: 0,
                                    filter: isResizing
                                        ? 'brightness(1.04) saturate(1.1)'
                                        : (isWhiteboardOpen ? 'brightness(0.92)' : 'brightness(1)'),
                                }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={isResizing ? { duration: 0.1 } : {
                                    y: { type: "spring", stiffness: 220, damping: 24, mass: 1.8 },
                                    layout: isWhiteboardOpen
                                        ? { type: "spring", stiffness: 260, damping: 26, mass: 1.5 }
                                        : { duration: 1.1, ease: [0.19, 1, 0.22, 1] },
                                    opacity: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                                    scale: { type: "spring", stiffness: 220, damping: 24 },
                                    filter: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                                }}
                                style={{
                                    background: 'linear-gradient(145deg, rgba(17, 17, 20, 0.9), rgba(10, 10, 12, 0.9))',
                                    boxShadow: isResizing
                                        ? '-8px -8px 20px rgba(255,255,255,0.015), 12px 12px 30px rgba(0,0,0,0.9), 0 0 20px rgba(6,182,212,0.08)'
                                        : '-8px -8px 20px rgba(255,255,255,0.015), 12px 12px 30px rgba(0,0,0,0.9)',
                                    marginLeft: '0.25rem',
                                    transformOrigin: "center left",
                                    transition: isResizing ? 'none' : 'box-shadow 0.5s ease, filter 0.5s ease',
                                }}
                                className="relative flex-1 flex flex-col overflow-hidden rounded-2xl border border-white/[0.04] backdrop-blur-xl md:rounded-[40px] will-change-transform"
                            >
                                {/* Chat Header */}
                                <div
                                    className="flex items-center justify-between px-6 py-[14px] border-b border-white/[0.04] shrink-0 backdrop-blur-xl"
                                    style={{
                                        background: 'linear-gradient(145deg, rgba(17, 17, 20, 0.95), rgba(12, 12, 14, 0.95))',
                                        boxShadow: 'inset -2px -2px 6px rgba(255,255,255,0.008), inset 3px 3px 8px rgba(0,0,0,0.6)',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                            <img src="/max-avatar.png" alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-bold text-white leading-tight">Hey, {studentName}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-white/40 font-medium">
                                                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                                                </span>
                                                {userStats && (
                                                    <>
                                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                                        <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">
                                                            LVL {userStats.level} • {userStats.xp} XP
                                                        </span>
                                                        {userStats.streak_count > 0 && (
                                                            <span className="text-[10px] text-orange-400/80 font-bold ml-1">
                                                                🔥 {userStats.streak_count}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {!isWhiteboardOpen && (
                                            <Button
                                                variant="neumorphic"
                                                size="sm"
                                                onClick={() => setIsWhiteboardOpen(true)}
                                                onMouseEnter={() => setIsIDEHovered(true)}
                                                onMouseLeave={() => setIsIDEHovered(false)}
                                                className="gap-2 px-5 py-2.5"
                                            >
                                                <SidebarToggleIcon isOpen={false} isHovered={isIDEHovered} className="size-[18px] opacity-70" />
                                                Dev Studio
                                            </Button>
                                        )}
                                        <Button
                                            variant="neumorphic"
                                            size="sm"
                                            onClick={() => setIsShareOpen(true)}
                                            className="gap-2 px-5 py-2.5"
                                        >
                                            <Share2 className="size-4 opacity-70" />
                                            Share
                                        </Button>
                                        <Button
                                            variant="neumorphic"
                                            size="sm"
                                            onClick={handleEndSession}
                                            className="gap-2 px-5 py-2.5 text-red-500/80 hover:text-red-400"
                                        >
                                            <X className="size-4 opacity-70" />
                                            End Session
                                        </Button>
                                    </div>
                                </div>
                                {/* Messages Scrollable Area */}
                                <motion.div
                                    animate={{
                                        opacity: isShareOpen ? 0 : 1,
                                        filter: isShareOpen ? 'blur(10px)' : 'blur(0px)',
                                        scale: isShareOpen ? 0.98 : 1
                                    }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex-1 w-full overflow-hidden"
                                >
                                    <ScrollArea className="h-full px-4 md:px-10 py-8">
                                        <div className="mx-auto max-w-4xl space-y-8">
                                            {messages.length === 0 ? (
                                                <div className="flex h-[40vh] flex-col items-center justify-center text-white/50">
                                                    <div className="mb-6 flex size-12 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                                                        <Sparkles className="size-5 opacity-50" />
                                                    </div>
                                                    <h3 className="mb-3 text-2xl font-semibold text-white/70">Start a conversation</h3>
                                                    <p className="text-base text-white/40">Ask me anything about any subject</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {messages.map((message, index) => (
                                                        <motion.div key={message.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`flex flex-col w-full ${message.role === "user" ? "items-end" : "items-start"}`}>
                                                            <div className={`flex gap-4 group max-w-full ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                                                <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[85%] min-w-0`}>
                                                                    <div className={cn(
                                                                        "py-1 tracking-tight leading-relaxed font-outfit break-words overflow-hidden w-full max-w-full",
                                                                        message.role === "user"
                                                                            ? "text-white/60 text-[14px] text-right"
                                                                            : "text-white text-[16px]"
                                                                    )}>
                                                                        <ReactMarkdown className={cn(
                                                                            "prose prose-invert max-w-none break-words overflow-hidden prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-none prose-strong:text-cyan-400 prose-code:text-cyan-300",
                                                                            message.role === "user" ? "prose-sm" : "prose-base"
                                                                        )}>
                                                                            {message.content}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                    {(message.content.includes("error") || message.content.includes("Connection error")) && message.role === "assistant" && (
                                                                        <button
                                                                            onClick={handleRetry}
                                                                            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[12px] font-medium text-white/60 transition-all active:scale-95"
                                                                        >
                                                                            <RefreshCw className="size-3" />
                                                                            Retry last message
                                                                        </button>
                                                                    )}
                                                                    <div className={`mt-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-3 text-white/20 pl-1`}>
                                                                        <button onClick={() => copyToClipboard(message.content)} className="hover:text-white transition-colors">
                                                                            <Copy className="size-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {index < messages.length - 1 && <div className="w-full h-px bg-white/[0.04] my-8" />}
                                                        </motion.div>
                                                    ))}
                                                    {isAILoading && (
                                                        <div className="flex items-start gap-4">
                                                            <div className="rounded-2xl border border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex gap-1.5">
                                                                        <div className="size-2 rounded-full bg-cyan-400/80 animate-pulse" />
                                                                        <div className="size-2 rounded-full bg-cyan-400/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                                                        <div className="size-2 rounded-full bg-cyan-400/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                                                    </div>
                                                                    <span className="text-[12px] font-semibold text-white/70 font-outfit uppercase tracking-widest">Agent is thinking...</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div ref={messagesEndRef} />
                                                </>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </motion.div>

                                {/* Share Popover — centered overlay inside the chat panel */}
                                <AnimatePresence>
                                    {isShareOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            className="absolute inset-0 z-50 flex items-center justify-center p-6"
                                        >
                                            {/* Backdrop to close */}
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsShareOpen(false)} />
                                            <div className="relative z-10 w-full flex items-center justify-center">
                                                <SharePopover isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Fixed Bottom Input Bar */}
                                <div
                                    className="shrink-0 px-4 pb-4 pt-2 md:px-8 md:pb-6 transition-all duration-500"
                                    style={{
                                        background: isCallActive ? 'transparent' : 'linear-gradient(145deg, rgba(14, 14, 16, 0.95), rgba(10, 10, 12, 0.95))',
                                        boxShadow: isCallActive ? 'none' : 'inset -2px -2px 6px rgba(255,255,255,0.008), inset 3px 3px 8px rgba(0,0,0,0.6)',
                                    }}
                                >
                                    <div className="mx-auto w-full max-w-[90%] md:max-w-[680px]">
                                        <ChatMorphBar
                                            onSend={handleSend}
                                            isLoading={isAILoading}
                                            isCallActive={isCallActive}
                                            isListening={webSpeech.isListening}
                                            isSpeaking={webSpeech.isSpeaking}
                                            interimTranscript={webSpeech.interimTranscript}
                                            onMicToggle={webSpeech.toggleListening}
                                            onStartCall={() => {
                                                setIsCallActive(true);
                                                if (!webSpeech.isListening) {
                                                    webSpeech.startListening();
                                                }
                                            }}
                                            onEndCall={() => {
                                                setIsCallActive(false);
                                                abortControllerRef.current?.abort();
                                                if (webSpeech.isListening) webSpeech.stopListening();
                                                webSpeech.stopSpeaking();
                                            }}
                                            onStop={() => {
                                                abortControllerRef.current?.abort();
                                                webSpeech.stopSpeaking();
                                            }}
                                            placeholder="Type your message..."
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Drag Handle */}
                            <AnimatePresence>
                                {isWhiteboardOpen && (
                                    <motion.div
                                        key="drag-handle"
                                        initial={{ opacity: 0, scaleY: 0 }}
                                        animate={{ opacity: 1, scaleY: 1 }}
                                        exit={{
                                            opacity: 0,
                                            width: 0,
                                            transition: { duration: 1.1, ease: [0.19, 1, 0.22, 1] }
                                        }}
                                        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.15 }}
                                        className={`hidden md:flex w-3 shrink-0 cursor-col-resize items-center justify-center group relative z-[60]`}
                                        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                                    >
                                        <div className={`h-16 w-1 rounded-full transition-all duration-300 ${isResizing ? 'bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-x-150' : 'bg-white/10 group-hover:bg-white/40'}`} />

                                        {/* Invisible wide hit area */}
                                        <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Global Resizing Fix: Overlay to prevent mouse focus loss */}
                            {isResizing && (
                                <div className="fixed inset-0 z-[100] cursor-col-resize" />
                            )}

                            {/* Whiteboard Panel (Right Side) */}
                            <AnimatePresence>
                                {isWhiteboardOpen && (
                                    <motion.div
                                        key="ide-panel"
                                        layout
                                        initial={{ y: "100%", opacity: 0 }}
                                        animate={{
                                            y: 0,
                                            x: 0,
                                            opacity: 1,
                                            scale: isResizing ? 0.985 : 1,
                                            filter: isResizing ? 'brightness(1.04) saturate(1.1)' : 'brightness(1)',
                                            transition: isResizing ? { duration: 0.1 } : {
                                                y: { type: "spring", stiffness: 220, damping: 24, mass: 1.8 },
                                                scale: { type: "spring", stiffness: 220, damping: 24 },
                                                opacity: { duration: 0.4, ease: "easeOut" }
                                            }
                                        }}
                                        exit={{
                                            x: "100%",
                                            width: 0,
                                            opacity: 0,
                                            marginLeft: 0,
                                            transition: {
                                                x: { duration: 1.1, ease: [0.19, 1, 0.22, 1] },
                                                width: { duration: 1.1, ease: [0.19, 1, 0.22, 1] },
                                                marginLeft: { duration: 1.1, ease: [0.19, 1, 0.22, 1] },
                                                opacity: { duration: 0.8, ease: "easeIn" }
                                            }
                                        }}
                                        style={{
                                            width: `${panelWidth}%`,
                                            maxHeight: '100%',
                                            transformOrigin: "center right",
                                            transition: isResizing ? 'none' : 'box-shadow 0.5s ease, filter 0.5s ease',
                                            background: 'linear-gradient(145deg, #111114, #0a0a0c)',
                                            boxShadow: isResizing
                                                ? '-8px -8px 20px rgba(255,255,255,0.015), 12px 12px 30px rgba(0,0,0,0.9), 0 0 20px rgba(6,182,212,0.08)'
                                                : '-8px -8px 20px rgba(255,255,255,0.015), 12px 12px 30px rgba(0,0,0,0.9)',
                                        }}
                                        className="hidden md:flex flex-col overflow-hidden rounded-[40px] border border-white/[0.04] shrink-0 ml-2 will-change-transform"
                                    >
                                        <div className="flex-1 overflow-auto">
                                            <PythonIDE
                                                initialCode={ideCode}
                                                onClose={() => setIsWhiteboardOpen(false)}
                                                onAction={handleIDEAction}
                                                language={ideLanguage}
                                                setLanguage={setIdeLanguage}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* CallDock removed — call controls now morph from ChatMorphBar */}

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 z-[70] w-[80%] max-w-xs border-r border-white/10 bg-black/90 p-6 backdrop-blur-2xl md:hidden"
                        >
                            <div className="flex flex-col space-y-8">
                                {/* Header */}
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500">
                                        <NewLogo className="size-6 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-white">AI Tutor</span>
                                </div>

                                {/* Main Navigation */}
                                <div className="space-y-2">
                                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Menu</h3>
                                    {dockItems.map((item) => (
                                        <a
                                            key={item.title}
                                            href={item.href}
                                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                        >
                                            <div className="size-5">{item.icon}</div>
                                            <span className="font-medium">{item.title}</span>
                                        </a>
                                    ))}
                                </div>

                                {/* Bottom Actions */}
                                <div className="pt-4">
                                    <button className="relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-medium tracking-wide text-white/80 backdrop-blur-md transition-all duration-300 ease-out hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[0_0_25px_rgba(0,255,200,0.12)] active:scale-95 active:bg-white/15">
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-teal-400 opacity-70" />
                                        <span>New Chat</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Resizing Global Styles */}
            <style jsx global>{`
                body.resizing-active {
                    cursor: col-resize !important;
                    user-select: none !important;
                }
                body.resizing-active * {
                    pointer-events: none !important;
                    cursor: col-resize !important;
                }
                body.resizing-active .fixed.inset-0.z-\[100\] {
                    pointer-events: auto !important;
                }
            `}</style>
        </div>
    )
}
