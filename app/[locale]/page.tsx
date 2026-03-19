"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  LayoutGroup
} from "framer-motion"
import {
  Code2,
  Calculator,
  Home,
  MessageSquare,
  Settings,
  BookOpen,
  User,
  Paperclip,
  Mic,
  Send,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Bot,
  Check,
  ArrowDown,
  Copy,
  RefreshCw,
  Share2,
  BrainCircuit,
  Gamepad2,
  LayoutDashboard
} from "lucide-react"
import { SharePopover } from "@/components/ui/SharePopover"
import ReactMarkdown from "react-markdown"
import { FeatureCard } from "@/components/FeatureCard"
import {
  ChatLayout,
  ChatPanel,
  Message,
  FloatingDock,
  ModePanel,
  sectionItems
} from "@/components/chat"
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
import { useTTS } from "@/lib/tts/useTTS"
import { fixTransliteration } from "@/lib/stt/sarvam_stt"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase/browser-client"
import LoginPage from "@/components/auth/LoginPage"
import { SidebarToggleIcon } from "@/components/ui/sidebar-toggle-icon"
import "@/styles/levelmap.css"
import HudBar from "@/components/HudBar"
import LevelMap from "@/components/LevelMap"
import LevelUpModal from "@/components/LevelUpModal"
import FinalBossCard from "@/components/FinalBossCard"
import DebugOverlay from "@/components/DebugOverlay"
import { getProgress, addXp, LEVELS, type LevelData } from "@/lib/levelStore"

const NewLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M13.732 1.91a3.75 3.75 0 0 0-3.515.085L4.162 5.401A3.75 3.75 0 0 0 2.25 8.67v6.66a3.75 3.75 0 0 0 1.912 3.27l6.055 3.406a3.75 3.75 0 0 0 3.515.085l3.05-1.525a1.75 1.75 0 1 0-1.565-3.13l-3.05 1.525a.25.25 0 0 1-.234-.006l-6.056-3.406a.25.25 0 0 1-.127-.218V8.67a.25.25 0 0 1 .127-.218l6.056-3.406a.25.25 0 0 1 .234-.006l3.05 1.525a1.75 1.75 0 1 0 1.566-3.13l-3.05-1.525Zm-1.874 6.076a1 1 0 0 1-.344 1.372L9.5 10.566V13a1 1 0 0 1-2 0V9.434l2.986-1.791a1 1 0 0 1 1.371.343ZM18 7.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"
      clipRule="evenodd"
    />
  </svg>
)

// Dock items for the floating dock navbar
const dockItems = [
  { title: "Home", icon: <Home className="size-full text-white" />, href: "/" },
  {
    title: "Game",
    icon: <Gamepad2 className="size-full text-white" />,
    href: "/game"
  },
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="size-full text-white" />,
    href: "/dashboard"
  },
  {
    title: "Profile",
    icon: <User className="size-full text-white" />,
    href: "/profile"
  },
  {
    title: "Settings",
    icon: <Settings className="size-full text-white" />,
    href: "/settings"
  }
]

const navItems = [
  { name: "Home", url: "/", icon: Home },
  { name: "Features", url: "#features", icon: Sparkles },
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Pricing", url: "#pricing", icon: Calculator },
  { name: "Profile", url: "#profile", icon: User }
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
  const [activeTab, setActiveTab] = useState<"chat" | "code">("chat")
  const [whiteboardWidth, setWhiteboardWidth] = useState(48) // Default 48%
  const [isDragging, setIsDragging] = useState(false)
  const [detectedLanguage, setDetectedLanguage] = useState("ta-IN")

  const [highlightLines, setHighlightLines] = useState<{ line: number; type: "concept" | "error" }[]>([])
  const [errorRanges, setErrorRanges] = useState<{ line: number; startColumn: number; endColumn: number; message: string }[]>([])
  const [errorPanel, setErrorPanel] = useState<{ title: string; message: string } | null>(null)
  const [uiActions, setUiActions] = useState<{ scroll_to_line?: number; pulse_line?: number; show_tooltip?: boolean } | null>(null)
  const [autoRunTrigger, setAutoRunTrigger] = useState(0)

  const count = useMotionValue(0)
  const rounded = useTransform(count, Math.round)
  const displayText = useTransform(rounded, latest => latest + "%")

  // Clean whiteboard - ready for AI content
  const [whiteboardData, setWhiteboardData] = useState<WhiteboardData>({
    width: 800,
    height: 550,
    coordinateSystem: "absolute",
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
    "Almost there..."
  ]
  const [thinkingIndex, setThinkingIndex] = useState(0)
  const [isAILoading, setIsAILoading] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isIDEHovered, setIsIDEHovered] = useState(false)
  const [ideLanguage, setIdeLanguage] = useState<"python" | "sql">("python")
  const [isCallActive, setIsCallActive] = useState(false)
  const isCallActiveRef = useRef(false) // Sync ref for async TTS trigger
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false) // When true, AI responses are spoken aloud
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { user, isLoading: isAuthLoading } = useAuth()
  const [userStats, setUserStats] = useState<{
    xp: number
    level: number
    streak_count: number
  } | null>(null)

  // Level Progression State
  const [progress, setProgress] = useState(getProgress());
  const [levelUpData, setLevelUpData] = useState<LevelData | null>(null)
  const [showFullMap, setShowFullMap] = useState(false)
  const mapOpacity = useMotionValue(1)

  useEffect(() => {
    const handleProgressUpdate = (e: any) => {
      setProgress(e.detail);
    };
    window.addEventListener("xpAdded", handleProgressUpdate);
    return () => window.removeEventListener("xpAdded", handleProgressUpdate);
  }, []);

  const [showGamifiedUI, setShowGamifiedUI] = useState(false);
  useEffect(() => {
    const handleToggle = () => setShowGamifiedUI(prev => !prev);
    window.addEventListener("toggleGamification", handleToggle);
    return () => window.removeEventListener("toggleGamification", handleToggle);
  }, []);

  // Fetch User Stats from Supabase
  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("xp, level, streak_count")
          .eq("id", user.id)
          .single()

        if (error) {
          // Row doesn't exist yet — create it via upsert (ignoreDuplicates protects existing data)
          console.warn(
            "[Stats] User row not found, creating default:",
            error.message
          )
          const { error: upsertError } = await supabase.from("users").upsert(
            {
              id: user.id,
              email: user.email,
              xp: 0,
              level: 1,
              streak_count: 0
            },
            { onConflict: "id", ignoreDuplicates: true }
          )
          if (upsertError) {
            console.error(
              "[Stats] Failed to create user row:",
              upsertError.message
            )
          }
          setUserStats({ xp: 0, level: 1, streak_count: 0 })
        } else if (data) {
          setUserStats(data)
        }
      } catch (err: any) {
        console.error(
          "[Stats] Unexpected error fetching stats:",
          err.message || err
        )
      }
    }
    fetchStats()
  }, [user])

  // Force loader to show for exactly 7 seconds
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 7000)
    return () => clearTimeout(timer)
  }, [])

  // 1. Initial Loading State
  useEffect(() => {
    const timeout = setTimeout(() => setIsMobileLoading(false), 2000)
    return () => clearTimeout(timeout)
  }, [])

  // ── Student Profile — Persistent Memory ─────────────────
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const studentId = user?.id || "default" // Map to Supabase Auth ID
  const sessionTopicsRef = useRef<Set<string>>(new Set())

  // Load student profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/student?id=${studentId}`)
        if (res.ok) {
          const data = await res.json()
          setStudentProfile(data.profile)
          console.log(
            "[Profile] Loaded student profile:",
            data.profile?.display_name,
            "| Sessions:",
            data.sessionCount
          )
        }
      } catch (err) {
        console.warn("[Profile] Could not load student profile:", err)
      }
    }
    loadProfile()
  }, [])

  // Get dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }
  const studentName =
    studentProfile?.display_name || user?.email?.split("@")[0] || "Learner"

  // Save session summary on unmount / before unload
  const saveSessionSummary = useRef(async () => {
    if (messages.length < 2) return // Need at least one exchange
    try {
      const topics = Array.from(sessionTopicsRef.current)
      const lastMessages = messages
        .slice(-4)
        .map(m => m.content)
        .join(" ")
      await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          session: {
            session_summary: `Covered ${topics.length > 0 ? topics.join(", ") : "general discussion"}. Last exchange: ${lastMessages.slice(0, 200)}`,
            topics_covered: topics,
            concepts_mastered: [],
            concepts_needing_revision: [],
            suggested_next_topic: "",
            student_confidence_signal: "medium",
            topic_stack: topics
          }
        })
      })
      console.log("[Profile] Session saved successfully")
    } catch (err) {
      console.warn("[Profile] Could not save session:", err)
    }
  })

  // Keep the ref up to date with latest messages
  useEffect(() => {
    saveSessionSummary.current = async () => {
      if (messages.length < 2) return
      try {
        const topics = Array.from(sessionTopicsRef.current)
        const lastMessages = messages
          .slice(-4)
          .map(m => m.content)
          .join(" ")
        await fetch("/api/student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            session: {
              session_summary: `Covered ${topics.length > 0 ? topics.join(", ") : "general discussion"}. Last exchange: ${lastMessages.slice(0, 200)}`,
              topics_covered: topics,
              concepts_mastered: [],
              concepts_needing_revision: [],
              suggested_next_topic: "",
              student_confidence_signal: "medium",
              topic_stack: topics
            }
          })
        })
        console.log("[Profile] Session saved successfully")
      } catch (err) {
        console.warn("[Profile] Could not save session:", err)
      }
    }
  }, [messages])

  // Auto-save session before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable fire-and-forget on unload
      if (messages.length >= 2) {
        const topics = Array.from(sessionTopicsRef.current)
        const lastMessages = messages
          .slice(-4)
          .map(m => m.content)
          .join(" ")
        navigator.sendBeacon(
          "/api/student",
          JSON.stringify({
            studentId,
            session: {
              session_summary: `Covered ${topics.length > 0 ? topics.join(", ") : "general discussion"}. Last exchange: ${lastMessages.slice(0, 200)}`,
              topics_covered: topics,
              concepts_mastered: [],
              concepts_needing_revision: [],
              suggested_next_topic: "",
              student_confidence_signal: "medium",
              topic_stack: topics
            }
          })
        )
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [messages])

  // ── Language Resolution for Call Mode ──────────────────
  // In call mode — always return Tamil for rural students
  const resolvedLanguage = (langCode: string): string => {
    // Always return Tamil (ta-IN) for rural students in this application
    return "ta-IN"
  }

  // ── Web Speech API Integration ──────────────────
  const tts = useTTS()
  const webSpeech = useWebSpeech({
    language: "ta-IN",
    continuous: false,
    onFinalTranscript: (text, languageCode, audioUrl) => {
      console.log("[Voice] Final transcript received:", text, languageCode)

      const fixedText = fixTransliteration(text.trim())
      console.log("[Voice] UI Fixed transcript:", fixedText)

      // ── VALIDATION: Ensure transcript is never empty before sending to AI ──
      if (!fixedText || fixedText.trim().length === 0) {
        console.warn("[Voice] Empty transcript detected. Aborting AI call.");
        // Optional: show a toast or a message in the chat
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "I couldn't hear you clearly. Please try again.",
          role: "assistant",
          timestamp: new Date()
        }]);
        return;
      }

      if (languageCode) {
        setDetectedLanguage(resolvedLanguage(languageCode))
      }

      setVoiceModeEnabled(true) // Enable TTS for this conversation turn
      handleSend(
        fixedText,
        languageCode ? resolvedLanguage(languageCode) : undefined,
        audioUrl
      )
    },
    onError: error => {
      console.error("[Voice] STT Critical Error:", error)
      // Show error to user in chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `Voice error: ${error}. Try typing your doubt?`,
        role: "assistant",
        timestamp: new Date()
      }]);
    }

  })

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsAILoading(false)
  }

  // ─── RESIZER LOGIC ───────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      // Calculate percentage from right
      const screenWidth = window.innerWidth
      const minChatWidth = 400 // px
      const minIDEWidth = 300 // px

      const mouseX = e.clientX
      const newWidthPx = screenWidth - mouseX
      const newWidthPercent = (newWidthPx / screenWidth) * 100

      // Constraints to prevent UI collapse (roughly 30% to 70%)
      if (newWidthPercent >= 30 && newWidthPercent <= 70) {
        setWhiteboardWidth(newWidthPercent)
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        document.body.style.cursor = "default"
        document.body.style.userSelect = "auto"
      }
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (
      isAILoading &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "user"
    ) {
      interval = setInterval(() => {
        setThinkingIndex(prev => (prev + 1) % thinkingPhrases.length)
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isAILoading, messages, thinkingPhrases.length])

  // Auto-scroll to latest message properly
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isAILoading])

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

  // Force body overflow hidden to prevent page scroll
  useEffect(() => {
    if (isChatMode) {
      document.documentElement.style.overflow = "hidden"
      document.body.style.overflow = "hidden"
    } else {
      document.documentElement.style.overflow = "auto"
      document.body.style.overflow = "auto"
    }
  }, [isChatMode])

  // Browser back button support for exiting chat mode
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we're in chat mode and user pressed back, exit chat mode
      if (isChatMode && (!event.state || !event.state.chatMode)) {
        setIsChatMode(false)
        setMessages([])
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isChatMode])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleSend = async (
    message: string,
    filesOrLangCode?: File[] | string,
    audioUrl?: string
  ) => {
    if (!user) {
      router.push("/login")
      return
    }
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isAILoading) return

    // Set loading immediately to block duplicate sends
    setIsAILoading(true)
    console.log("Message send:", trimmedMessage)

    const newMessage: Message = {
      id: Date.now().toString(),
      content: trimmedMessage,
      role: "user",
      timestamp: new Date(),
      type: audioUrl ? "voice" : "text",
      audioUrl: audioUrl
    }

    // Functional state update to prevent race conditions
    setMessages(prev => [...prev, newMessage])

    // Trigger chat mode on first message
    if (!isChatMode) {
      window.history.pushState({ chatMode: true }, "", window.location.href)
      setIsChatMode(true)
    }

    const overrideLangCode =
      typeof filesOrLangCode === "string" ? filesOrLangCode : undefined
    const langToPass = overrideLangCode || detectedLanguage
    await processAICall([...messages, newMessage], langToPass)
  }

  // ── Mastery & XP Award Logic ──────────────────
  function detectMasteryAndAwardXP(aiResponseText: string, userMessageText: string) {
    const combined = (aiResponseText + " " + userMessageText).toLowerCase()
    const progress = getProgress()
    const currentLevel = progress.currentLevel
    const levelData = LEVELS[currentLevel - 1]

    const matched = levelData.keywords.some(kw => combined.includes(kw))

    if (matched) {
      const result = addXp(10)

      if (result.leveledUp) {
        // 1. Show Kalam bubble first
        injectKalamLevelMessage(result.newLevel!)
        // 2. Wait 800ms then show modal
        setTimeout(() => setLevelUpData(LEVELS[result.newLevel! - 1]), 800)
        // 3. If level 5, inject final boss card after modal dismiss
        if (result.newLevel === 5) {
          setTimeout(() => injectFinalBossCard(), 4000)
        }
      }
    }
  }

  function injectKalamLevelMessage(newLevel: number) {
    const message: Message = {
      id: "level-up-" + Date.now(),
      role: "assistant",
      timestamp: new Date(),
      content: "Nee ippo next level-ku ready da. ✦",
      isCustomKalam: true // Marker for custom styling
    }
    setMessages(prev => [...prev, message])
  }

  function injectFinalBossCard() {
    const message: Message = {
      id: "final-boss-" + Date.now(),
      role: "assistant",
      timestamp: new Date(),
      isFinalBoss: true // Marker for FinalBossCard
    }
    setMessages(prev => [...prev, message])
  }

  const processAICall = async (
    currentMessages: Message[],
    langCode?: string,
    errorContext?: { code: string; error?: string; line?: number; action?: string }
  ) => {
    setIsAILoading(true)
    setErrorRanges([])
    setHighlightLines([])
    setErrorPanel(null)
    setUiActions(null)
    console.log("API call start", errorContext ? "with error context" : "")
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/chat/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: currentMessages,
          mode: errorContext?.action || (errorContext ? "review" : (isCallActive ? "teach" : undefined)),
          language: isWhiteboardOpen ? ideLanguage : "python",
          studentId,
          detectedLanguage: langCode || detectedLanguage,
          // PASS ERROR TO BACKEND
          code: errorContext?.code,
          error: errorContext?.error,
          error_line: errorContext?.line
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error(
          "API Error:",
          response.status,
          response.statusText,
          errText
        )
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errText = await response.text()
        console.error("Non-JSON Response:", errText.slice(0, 200))
        throw new TypeError("Expected JSON response from /api/chat/tutor")
      }

      // Safely parse JSON to handle Tamil unicode edge cases
      const rawText = await response.text()
      let data
      try {
        // Ensure proper encoding for Tamil chars
        const sanitizedText = rawText.replace(/[\u0000-\u0019]+/g, "")
        data = JSON.parse(sanitizedText)
      } catch (err) {
        console.error("JSON Parse Error. Raw response:", rawText.slice(0, 500))
        throw new Error("Failed to parse AI response stream safely.")
      }

      console.log("API response success:", data)
      console.log('[REPLY]', data.reply);
      console.log('[CODE]', data.code_example);
      console.log('[FOLLOWUP]', data.followup_question);
      console.log('[XP]', data.xp_to_award);

      console.log(
        "[DEBUG] Full response data:",
        JSON.stringify(data).slice(0, 300)
      )
      console.log(
        "[DEBUG] data.explanation:",
        typeof data.explanation,
        data.explanation?.slice?.(0, 100)
      )
      // FIX 2: Guard — never send empty reply to student
      const rawAiContent =
        (data.reply && data.reply.trim() !== "")
          ? data.reply
          : (data.followup_question || data.explanation || "I received your message.")

      // EXCLUSIVE CLEANING: Remove markdown code blocks and "Code Example:" markers from chat
      let strippedContent = rawAiContent
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<think>/gi, "")
        .replace(/```[\s\S]*?```/g, "") // strip multi-line code blocks
        .replace(/Code Example:/gi, "")
        .replace(/Output:/gi, "")
        .trim()

      const aiContent =
        strippedContent ||
        rawAiContent.replace(/<\/?think>/g, "").trim() ||
        (data.followup_question || "Enna doubt da?")


      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        role: "assistant",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])

      // 🔊 Universal Markdown Stripper for TTS
      const stripMarkdownForTTS = (text: string) => {
        return text
          .replace(/```[\s\S]*?```/g, " code block ")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/[#*_~>]/g, "")
          .replace(/<[^>]*>/g, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/\n{2,}/g, ". ")
          .replace(/\n/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim()
      }

      // 🔊 Auto-speak AI response if call is active OR voice mode was manually triggered
      if (isCallActiveRef.current || voiceModeEnabled) {
        const finalLang = langCode || detectedLanguage
        const speakLangCode = finalLang === "english" ? "en-IN" : "ta-IN"
        const plainText = data.tts_text ? data.tts_text : stripMarkdownForTTS(aiContent)

        console.log("[TTS] Using Sarvam AI:", speakLangCode)
        tts.speakText(plainText, speakLangCode)
        setVoiceModeEnabled(false)
      }

      // 💻 Inject code into right-side IDE if present
      const codeToInject = data.code_with_comments || data.code_example || data.code || data.clean_code;
      console.log(
        "[IDE] Code received:",
        codeToInject ? codeToInject.slice(0, 80) : "(empty)"
      )
      if (codeToInject && codeToInject.trim()) {
        setIdeCode(codeToInject)
        setIsWhiteboardOpen(true)

        if (data.highlight_lines && Array.isArray(data.highlight_lines)) {
          setHighlightLines(data.highlight_lines)
        } else {
          setHighlightLines([])
        }

        if (data.error_ranges && Array.isArray(data.error_ranges)) {
          setErrorRanges(data.error_ranges)
        } else {
          setErrorRanges([])
        }

        if (data.error_panel) {
          setErrorPanel(data.error_panel)
        } else {
          setErrorPanel(null)
        }

        if (data.ui_actions) {
          setUiActions(data.ui_actions)
        } else {
          setUiActions(null)
        }

        // Trigger auto-run explicitly requested by AI or if it's clean teaching code
        const hasMistakes = codeToInject.includes("# ❌")
        if (data.auto_run === true || !hasMistakes) {
          setAutoRunTrigger(prev => prev + 1)
        }
      }
      // If code is empty, keep previous IDE content — don't clear it

      // Track topics mentioned in this session
      const topicKeywords = [
        "loop",
        "function",
        "variable",
        "string",
        "list",
        "dict",
        "class",
        "array",
        "conditional",
        "if else",
        "for loop",
        "while",
        "recursion",
        "sorting",
        "SQL",
        "SELECT",
        "JOIN",
        "WHERE",
        "INSERT",
        "UPDATE",
        "DELETE",
        "method"
      ]
      const userMsg =
        currentMessages[currentMessages.length - 1]?.content?.toLowerCase() ||
        ""
      for (const kw of topicKeywords) {
        if (userMsg.includes(kw.toLowerCase())) {
          sessionTopicsRef.current.add(kw)
        }
      }

      // 🏆 Award XP & Detect Level Up
      detectMasteryAndAwardXP(data.reply || "", userMsg)
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Generation stopped by user")
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: "Generation stopped.",
            role: "assistant",
            timestamp: new Date()
          }
        ])
      } else {
        console.error("API call error catch:", error)
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: "Connection error. Please check your network.",
            role: "assistant",
            timestamp: new Date()
          }
        ])
      }
    } finally {
      setIsAILoading(false)
    }
  }

  const handleRetry = () => {
    const userMessages = messages.filter(m => m.role === "user")
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1]
      console.log("Retrying last message:", lastUserMessage.content)
      processAICall(messages, detectedLanguage)
    }
  }

  const handleFullScreenSend = () => {
    if (inputValue.trim()) {
      handleSend(inputValue.trim())
      setInputValue("")
    }
  }

  const handleEndSession = async () => {
    if (messages.length < 2) {
      setIsChatMode(false)
      setMessages([])
      return
    }

    setIsAILoading(true)
    const userMsg: Message = {
      id: Date.now().toString(),
      content: "Please wrap up our session.",
      role: "user",
      timestamp: new Date()
    }
    const currentMessages = [...messages, userMsg]
    setMessages(currentMessages)

    try {
      const response = await fetch("/api/chat/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          mode: "wrap_up",
          studentId
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          content:
            data.explanation ||
            "Session complete. Your progress has been saved!",
          role: "assistant",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMsg])
      }
    } catch (err) {
      console.error("End Session Error:", err)
    } finally {
      setIsAILoading(false)
      // Delay exit slightly so student can see the summary message
      setTimeout(() => {
        setIsChatMode(false)
        setMessages([])
      }, 3000)
    }
  }

  const handleIDEAction = async (
    action: string,
    code: string,
    output: string,
    line?: number
  ) => {
    // Trigger chat mode
    if (!isChatMode) {
      window.history.pushState({ chatMode: true }, "", window.location.href)
      setIsChatMode(true)
    }

    // Add a "system" style user message to the chat
    const userMsg: Message = {
      id: Date.now().toString(),
      content:
        action === "review"
          ? "Please review my code."
          : "Teach me about this code.",
      role: "user",
      timestamp: new Date()
    }

    const currentMessages = [...messages, userMsg]
    setMessages(currentMessages)

    // DRY mapping to main processor
    const errorStr =
      output.toLowerCase().includes("error") ||
        output.toLowerCase().includes("exception") ||
        output.toLowerCase().includes("traceback")
        ? output
        : undefined

    await processAICall(currentMessages, detectedLanguage, {
      code,
      error: errorStr,
      line,
      action
    })
  }

  const handleNewChat = () => {
    setIsChatMode(true)
    setMessages([])
    window.history.pushState({ chatMode: true }, "", window.location.href)
  }

  return (
    <AnimatePresence>
      {(isAuthLoading || isInitialLoading) && (
        <motion.div
          key="initial-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-md"
        >
          <KineticDotsLoader />
        </motion.div>
      )}

      {(!isAuthLoading && !isInitialLoading) && (
        <motion.div
          key="main-app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex h-screen w-full overflow-hidden"
        >
          <div className="flex h-screen w-full overflow-hidden">
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

            {/* Floating Dock - Left Side Vertical (desktop only >1024px; hidden on tablet to prevent overlap) */}
            <div className="fixed left-3 top-1/2 z-[60] hidden -translate-y-1/2 lg:block">
              <FloatingDock
                items={dockItems}
                onNewChat={handleNewChat}
                onSectionSelect={section => console.log("Section selected:", section)}
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
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                  }}
                  className="relative z-20 flex flex-1 flex-col"
                >
                  {/* Seamless Black Glass Overlay */}
                  <div className="pointer-events-none fixed inset-0 z-10 bg-black/15 backdrop-blur-sm" />

                  {/* Top Gradient for subtle depth */}
                  <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-b from-black/40 to-transparent" />

                  {/* Header Section */}
                  <NavBar items={navItems} />

                  {/* Background Radial Gradients */}
                  <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-1/4 top-20 size-[600px] rounded-full bg-cyan-500/5 blur-3xl" />
                    <div className="absolute right-1/4 top-40 size-[500px] rounded-full bg-teal-500/5 blur-3xl" />
                    <div className="absolute bottom-20 left-1/3 size-[400px] rounded-full bg-emerald-500/5 blur-3xl" />
                  </div>

                  {/* Main Content Container — tablet 90% width (max-w-[1100px]), padding px-4 sm:px-8 md:px-12 */}
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-8 pt-[14vh] sm:gap-5 sm:px-8 sm:pt-[16vh] md:gap-8 md:px-12 md:pb-10 md:pt-[18vh] lg:gap-10 lg:px-16 lg:pb-12 lg:pt-[22vh]">
                    <div className="mx-auto flex w-full max-w-[95%] flex-col items-center sm:max-w-[95%] md:max-w-[min(90%,1100px)] lg:max-w-6xl">
                      {/* 1. Hero — tablet uses text-4xl/5xl scale so it feels like scaled desktop, not mobile */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="z-20 w-full text-center"
                      >
                        <h2 className="font-darker-grotesque mb-3 text-xl font-black uppercase tracking-[0.15em] text-white/30 sm:mb-4 sm:text-2xl md:mb-6 md:text-3xl md:tracking-[0.2em] lg:mb-12 lg:text-[32px] lg:tracking-[0.3em]">
                          Welcome back
                        </h2>
                        <h1 className="font-darker-grotesque mb-2 text-3xl font-bold leading-[0.9] tracking-tight text-white sm:text-4xl md:text-6xl md:leading-[0.95] lg:text-[80px] lg:leading-[0.9]">
                          {getGreeting()},{" "}
                          <span className="animate-gradient font-darker-grotesque bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-[length:200%_auto] bg-clip-text text-transparent">
                            {studentName}
                          </span>
                        </h1>
                      </motion.div>

                      {/* 2. Ask me anything — tablet: ~48px gap below hero; desktop unchanged */}
                      <div className="pointer-events-none z-20 mt-6 flex w-full flex-col items-center justify-center md:mt-14 lg:mt-20 lg:flex-row lg:gap-4 lg:text-left">
                        <div className="flex flex-col items-center gap-2 text-center md:gap-4 lg:flex-row lg:gap-4">
                          <span className="font-darker-grotesque text-lg font-light uppercase leading-tight tracking-[0.1em] text-white/80 opacity-70 sm:text-xl md:text-3xl md:tracking-[0.12em] lg:text-5xl lg:tracking-[0.15em]">
                            Ask me anything
                          </span>
                          <div className="flex w-[160px] items-center justify-center text-center sm:w-[200px] md:w-[280px] lg:w-[320px] lg:justify-start lg:text-left">
                            <TextRotate
                              texts={[
                                "Programming",
                                "Mathematics",
                                "AI",
                                "Literature"
                              ]}
                              mainClassName="text-cyan-400 font-darker-grotesque font-semibold leading-tight tracking-wide text-lg sm:text-xl md:text-3xl lg:text-5xl"
                              staggerFrom="last"
                              initial={{ y: "100%", opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: "-120%", opacity: 0 }}
                              staggerDuration={0.025}
                              splitBy="characters"
                              transition={{
                                type: "spring",
                                damping: 30,
                                stiffness: 400
                              }}
                              rotationInterval={3000}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Chat input — mobile 90%, tablet 85% (wide), desktop 60% centered; tablet: 56px top margin */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.2,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="z-20 mt-4 w-full max-w-[320px] px-0 sm:mt-6 sm:max-w-[450px] md:mt-16 md:max-w-[550px] lg:mt-20 lg:max-w-[650px]"
                      >
                        <ChatMorphBar
                          onSend={handleSend}
                          isLoading={isAILoading}
                          isCallActive={isCallActive}
                          isListening={webSpeech.isListening}
                          isSpeaking={webSpeech.isSpeaking}
                          interimTranscript={webSpeech.interimTranscript}
                          mediaStream={webSpeech.activeStream}
                          audioElement={webSpeech.activeAudioElement}
                          onMicToggle={webSpeech.toggleListening}
                          onStartCall={() => {
                            setIsCallActive(true)
                            isCallActiveRef.current = true
                            if (!webSpeech.isListening) {
                              webSpeech.startListening()
                            }
                          }}
                          onEndCall={() => {
                            setIsCallActive(false)
                            isCallActiveRef.current = false
                            abortControllerRef.current?.abort()
                            if (webSpeech.isListening) webSpeech.stopListening()
                            webSpeech.stopSpeaking()
                          }}
                          onStop={() => {
                            abortControllerRef.current?.abort()
                            webSpeech.stopSpeaking()
                          }}
                          placeholder="Type a subject or paste a problem..."
                          className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
                        />
                      </motion.div>
                    </div>
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
                  className="fixed inset-0 z-50 flex items-center justify-center overflow-visible lg:pl-[110px]"
                >
                  <div className={cn("flex size-full flex-col items-center justify-center pb-8 pt-2 transition-all duration-700", !showGamifiedUI ? "p-6" : "px-4")}>
                    {showGamifiedUI && <HudBar />}
                    <div className={cn("flex w-full flex-1 overflow-visible transition-all duration-500", !showGamifiedUI && "h-[90vh]")}>
                      {showGamifiedUI && (
                        <motion.div
                          style={{ opacity: mapOpacity }}
                          className="hidden h-full w-[280px] flex-col border-r border-white/5 bg-[#03060F] md:flex"
                        >
                          <div className="flex-1 overflow-hidden">
                            <LevelMap />
                          </div>

                          {/* Part 8 — XP Bar Component */}
                          <div className="shrink-0 bg-[#03060F] p-4 pb-6">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                                Level {progress.currentLevel} of 5
                              </span>
                              <span className="font-mono text-[9px] font-bold text-white/40">
                                {progress.totalXp} / {LEVELS[progress.currentLevel] ? LEVELS[progress.currentLevel].xpRequired : '-'} XP
                              </span>
                            </div>
                            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(100, (progress.totalXp / (LEVELS[progress.currentLevel]?.xpRequired || progress.totalXp || 1)) * 100)}%`
                                }}
                                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                className="h-full bg-gradient-to-r from-[#4F46E5] to-[#9333EA]"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {/* Background Layer with Radial Gradient */}
                      <div className="bg-gradient-radial absolute inset-0 from-cyan-900/10 via-black/40 to-black/60 backdrop-blur-sm" />

                      {/* Subtle Glowing Blobs */}
                      <div className="absolute left-1/4 top-1/4 size-96 animate-pulse rounded-full bg-cyan-500/5 blur-3xl" />
                      <div
                        className="absolute bottom-1/4 right-1/4 size-80 animate-pulse rounded-full bg-teal-500/5 blur-3xl"
                        style={{ animationDelay: "1s" }}
                      />

                      {/* Main Split Container — stack on mobile/tablet (≤1024px), row on desktop (>1024px) */}
                      <div className="relative flex size-full min-h-0 flex-col gap-1 lg:flex-row lg:gap-1">
                        {/* Chat Container — Now consistently on the left */}
                        <motion.div
                          key="chat-panel"
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{
                            opacity: 1,
                            scale: isWhiteboardOpen ? 0.99 : 1,
                            y: 0,
                            filter: isWhiteboardOpen
                              ? "brightness(0.92)"
                              : "brightness(1)"
                          }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          transition={
                            {
                              y: {
                                type: "spring",
                                stiffness: 220,
                                damping: 24,
                                mass: 1.8
                              },
                              layout: isWhiteboardOpen
                                ? {
                                  type: "spring",
                                  stiffness: 260,
                                  damping: 26,
                                  mass: 1.5
                                }
                                : { duration: 1.1, ease: [0.19, 1, 0.22, 1] },
                              opacity: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                              scale: { type: "spring", stiffness: 220, damping: 24 },
                              filter: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                            }
                          }
                          style={{
                            background:
                              "linear-gradient(145deg, rgba(13, 14, 18, 0.8), rgba(8, 8, 10, 0.8))",
                            boxShadow: "-8px -8px 24px rgba(255,255,255,0.01), 16px 16px 40px rgba(0,0,0,0.9)",
                            transformOrigin: "center left",
                            transition: "box-shadow 0.5s ease, filter 0.5s ease"
                          }}
                          className={cn(
                            "group/chat relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black backdrop-blur-2xl will-change-transform md:min-h-[45vh] lg:min-h-0 lg:rounded-[48px]",
                            activeTab === "chat" ? "flex" : "hidden md:flex"
                          )}
                        >
                          {/* Top & Bottom Sizing Pills */}
                          <div className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 opacity-0 transition-opacity group-hover/chat:opacity-100">
                            <div className="flex h-6 items-center rounded-full border border-orange-500/30 bg-[#070B18]/90 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-orange-400 backdrop-blur-md">
                              {(100 - whiteboardWidth).toFixed(0)}% CHAT
                            </div>
                          </div>
                          <div className="pointer-events-none absolute bottom-4 left-1/2 z-50 -translate-x-1/2 opacity-0 transition-opacity group-hover/chat:opacity-100">
                            <div className="flex h-6 items-center rounded-full border border-orange-500/30 bg-[#070B18]/90 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-orange-400 backdrop-blur-md">
                              SIZE-X: {((100 - whiteboardWidth) * 19.2).toFixed(0)}
                            </div>
                          </div>

                          {/* Chat Header — responsive padding for tablet */}
                          <div
                            className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] px-6 py-3 backdrop-blur-xl md:py-[12px] lg:px-12 lg:py-[14px]"
                            style={{
                              background: "transparent",
                              boxShadow: "none"
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative size-10 overflow-hidden rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                <img
                                  src="/max-avatar.png"
                                  alt="Profile"
                                  className="size-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold leading-tight text-white">
                                  Hey, {studentName}
                                </span>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-white/40">
                                    {new Date().toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "long"
                                    })}
                                  </span>
                                  {userStats && (
                                    <>
                                      <div className="size-1 rounded-full bg-white/10" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/80">
                                        LVL {userStats.level} • {userStats.xp} XP
                                      </span>
                                      {userStats.streak_count > 0 && (
                                        <span className="ml-1 text-[10px] font-bold text-orange-400/80">
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
                                  <SidebarToggleIcon
                                    isOpen={false}
                                    isHovered={isIDEHovered}
                                    className="size-[18px] opacity-70"
                                  />
                                  Dev Studio
                                </Button>
                              )}
                              <Button
                                variant="neumorphic"
                                size="sm"
                                onClick={() => setShowFullMap(true)}
                                className="gap-2 px-5 py-2.5"
                              >
                                My Progress
                              </Button>
                              <Button
                                variant="neumorphic"
                                size="sm"
                                onClick={() => setIsShareOpen(true)}
                                className="gap-2 px-5 py-2.5"
                              >
                                <Share2 className="size-4 opacity-70" />
                                Share
                              </Button>
                            </div>
                          </div>
                          {/* Messages Scrollable Area */}
                          <motion.div
                            animate={{
                              opacity: isShareOpen ? 0 : 1,
                              filter: isShareOpen ? "blur(10px)" : "blur(0px)",
                              scale: isShareOpen ? 0.98 : 1
                            }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full flex-1 overflow-hidden"
                          >
                            <ScrollArea className="h-full">
                              <div className="mx-auto max-w-4xl space-y-8 px-6 py-8 md:px-12">
                                {messages.length === 0 ? (
                                  <div className="flex h-[40vh] flex-col items-center justify-center text-white/50">
                                    <div className="mb-6 flex size-12 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                                      <Sparkles className="size-5 opacity-50" />
                                    </div>
                                    <h3 className="mb-3 text-2xl font-semibold text-white/70">
                                      Start a conversation
                                    </h3>
                                    <p className="text-base text-white/40">
                                      Ask me anything about any subject
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    {messages.map((message, index) => (
                                      <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`flex w-full flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                                      >
                                        <div
                                          className={`group flex max-w-full gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                          <div
                                            className={`flex flex-col ${message.role === "user" ? "mr-6 items-end" : "ml-2 items-start"} min-w-0 max-w-[85%]`}
                                          >
                                            <div
                                              className={cn(
                                                "font-outfit w-full max-w-full break-words py-1 leading-relaxed tracking-tight",
                                                message.role === "user"
                                                  ? "text-right text-[14px] text-white/60"
                                                  : "text-[16px] text-white"
                                              )}
                                            >
                                              {message.isCustomKalam ? (
                                                <div className="kalam-level-bubble-wrapper">
                                                  <div className="relative size-10 overflow-hidden rounded-xl border border-cyan-500/30">
                                                    <img src="/max-avatar.png" alt="Kalam" className="size-full object-cover" />
                                                  </div>
                                                  <div className="kalam-level-bubble-content">
                                                    <div className="kalam-level-name">Kalam</div>
                                                    <div className="kalam-level-text">
                                                      {message.content} <span className="kalam-star">✦</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : message.isFinalBoss ? (
                                                <FinalBossCard />
                                              ) : message.type === "voice" && message.audioUrl ? (
                                                <div className={`mb-2 flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                                                  <div className="voice-bubble flex w-full min-w-[320px] max-w-[450px] flex-col rounded-[2.5rem] border border-white/[0.02] bg-[rgba(13,13,15,0.92)] p-2 shadow-[-6px_-6px_14px_rgba(255,255,255,0.02),6px_6px_14px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-500">
                                                    <div className="flex w-full items-center rounded-[2rem] bg-black/20 px-4 py-2 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_2px_2px_6px_rgba(0,0,0,0.8)]">
                                                      <audio controls src={message.audioUrl} className="h-10 w-full outline-none"></audio>
                                                    </div>
                                                  </div>

                                                  {message.content && (
                                                    <>
                                                      <div className="mt-2 cursor-pointer text-[10px] text-white/40 transition-colors hover:text-white/80" onClick={(e) => {
                                                        const target = e.currentTarget.nextElementSibling;
                                                        if (target) {
                                                          target.classList.toggle('hidden');
                                                        }
                                                      }}>
                                                        Tap to see transcript
                                                      </div>
                                                      <div className="mt-2 hidden max-w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left text-[13px] text-white/60">
                                                        {message.content || ""}
                                                      </div>
                                                    </>
                                                  )}

                                                  <style jsx>{`
                                                .voice-bubble audio {
                                                  border-radius: 12px;
                                                }
                                                .voice-bubble audio::-webkit-media-controls-panel {
                                                  background-color: rgba(255, 255, 255, 0.08);
                                                }
                                                .voice-bubble audio::-webkit-media-controls-current-time-display,
                                                .voice-bubble audio::-webkit-media-controls-time-remaining-display {
                                                  color: rgba(255, 255, 255, 0.8);
                                                }
                                                .voice-bubble audio::-webkit-media-controls-play-button,
                                                .voice-bubble audio::-webkit-media-controls-mute-button {
                                                  filter: invert(1);
                                                }
                                              `}</style>
                                                </div>
                                              ) : (
                                                <ReactMarkdown
                                                  className={cn(
                                                    "prose prose-invert prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-none prose-strong:text-cyan-400 prose-code:text-cyan-300 max-w-none overflow-hidden break-words",
                                                    message.role === "user"
                                                      ? "prose-sm"
                                                      : "prose-base"
                                                  )}
                                                >
                                                  {message.content || ""}
                                                </ReactMarkdown>
                                              )}
                                            </div>
                                            {(message.content?.includes("error") ||
                                              message.content?.includes(
                                                "Connection error"
                                              )) &&
                                              message.role === "assistant" && (
                                                <button
                                                  onClick={handleRetry}
                                                  className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-white/60 transition-all hover:bg-white/10 active:scale-95"
                                                >
                                                  <RefreshCw className="size-3" />
                                                  Retry last message
                                                </button>
                                              )}
                                            <div
                                              className={`mt-2 flex gap-3 pl-1 text-white/20 opacity-0 transition-opacity group-hover:opacity-100`}
                                            >
                                              <button
                                                onClick={() =>
                                                  copyToClipboard(message.content || "")
                                                }
                                                className="transition-colors hover:text-white"
                                              >
                                                <Copy className="size-4" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                        {
                                          index < messages.length - 1 && (
                                            <div className="my-8 h-px w-full bg-white/[0.04]" />
                                          )
                                        }
                                      </motion.div>
                                    ))}
                                    {isAILoading && (
                                      <div className="flex items-start gap-4">
                                        <div className="rounded-2xl border border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
                                          <div className="flex items-center gap-3">
                                            <div className="flex gap-1.5">
                                              <div className="size-2 animate-pulse rounded-full bg-cyan-400/80" />
                                              <div
                                                className="size-2 animate-pulse rounded-full bg-cyan-400/60"
                                                style={{ animationDelay: "0.2s" }}
                                              />
                                              <div
                                                className="size-2 animate-pulse rounded-full bg-cyan-400/40"
                                                style={{ animationDelay: "0.4s" }}
                                              />
                                            </div>
                                            <span className="font-outfit text-[12px] font-semibold uppercase tracking-widest text-white/70">
                                              Agent is thinking...
                                            </span>
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
                                <div
                                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                  onClick={() => setIsShareOpen(false)}
                                />
                                <div className="relative z-10 flex w-full items-center justify-center">
                                  <SharePopover
                                    isOpen={isShareOpen}
                                    onClose={() => setIsShareOpen(false)}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Fixed Bottom Input Bar */}
                          <div
                            className="shrink-0 px-6 pb-4 pt-2 transition-all duration-500 md:px-12 md:pb-6"
                            style={{
                              background: "transparent",
                              boxShadow: "none"
                            }}
                          >
                            <div className="mx-auto w-full max-w-full px-2">
                              <ChatMorphBar
                                onSend={handleSend}
                                isLoading={isAILoading}
                                isCallActive={isCallActive}
                                isListening={webSpeech.isListening}
                                isSpeaking={tts.isAISpeaking}
                                interimTranscript={webSpeech.interimTranscript}
                                mediaStream={webSpeech.activeStream}
                                audioElement={tts.activeAudioElement}
                                onMicToggle={webSpeech.toggleListening}
                                onStartCall={() => {
                                  setIsCallActive(true)
                                  isCallActiveRef.current = true
                                  if (!webSpeech.isListening) {
                                    webSpeech.startListening()
                                  }
                                }}
                                onEndCall={() => {
                                  setIsCallActive(false)
                                  isCallActiveRef.current = false
                                  abortControllerRef.current?.abort()
                                  if (webSpeech.isListening) webSpeech.stopListening()
                                  tts.stopSpeaking()
                                }}
                                onStop={() => {
                                  abortControllerRef.current?.abort()
                                  tts.stopSpeaking()
                                }}
                                placeholder="Type your message..."
                              />
                            </div>
                          </div>
                        </motion.div>

                        {/* Resizer Handle (Splitter) — Liquid Glass Design */}
                        <AnimatePresence>
                          {isWhiteboardOpen && (
                            <motion.div
                              initial={{ opacity: 0, scaleY: 0.8 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              exit={{ opacity: 0, scaleY: 0.8 }}
                              onMouseDown={handleMouseDown}
                              className={cn(
                                "group relative z-[100] mx-0.5 hidden h-[85vh] w-4 cursor-col-resize items-center justify-center lg:flex",
                                isDragging ? "active-drag" : ""
                              )}
                            >
                              {/* 1. Large Hit Area (Invisible) */}
                              <div className="absolute -inset-x-2 inset-y-0 z-10" />

                              {/* 2. Central Static Divider (Minimalist) */}
                              <div className="absolute inset-y-0 left-1/2 h-full w-[1px] -translate-x-1/2 bg-white/[0.03]" />

                              {/* 3. Glowing Energy Beam (Reveals on Hover/Drag) */}
                              <motion.div
                                initial={false}
                                animate={{
                                  opacity: isDragging ? 1 : 0,
                                  height: isDragging ? "100%" : "0%"
                                }}
                                className="group-hover:height-[100%] pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent transition-all duration-500 ease-out group-hover:opacity-100"
                              />

                              {/* 4. The Glass Handle — Translucent Pill */}
                              <motion.div
                                animate={{
                                  scale: isDragging ? 1.1 : 1,
                                  height: isDragging ? 48 : 40,
                                  width: isDragging ? 10 : 6
                                }}
                                className={cn(
                                  "relative z-20 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.05] shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 ease-out",
                                  "group-hover:border-cyan-500/30 group-hover:bg-white/[0.1] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]",
                                  isDragging ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.3)]" : ""
                                )}
                              >
                                {/* Inner Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />

                                {/* The 3 Logic Dots */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      animate={{
                                        opacity: isDragging ? 1 : 0.3,
                                        scale: isDragging ? 1.2 : 1
                                      }}
                                      className={cn(
                                        "size-1 rounded-full",
                                        isDragging ? "bg-cyan-400" : "bg-white"
                                      )}
                                      transition={{
                                        delay: i * 0.1,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        duration: 1
                                      }}
                                    />
                                  ))}
                                </div>
                              </motion.div>

                              {/* 6. Sizing/Drag Indicators (Top & Bottom) — Interactive Handles */}
                              <div
                                className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[150%] cursor-col-resize transition-transform active:scale-110"
                                onMouseDown={handleMouseDown}
                              >
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="whitespace-nowrap rounded-full border border-orange-500/40 bg-[#070B18]/95 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.25)] backdrop-blur-xl"
                                >
                                  DRAG {(100 - whiteboardWidth).toFixed(0)}:{whiteboardWidth.toFixed(0)}
                                </motion.div>
                              </div>

                              <div
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[150%] cursor-col-resize transition-transform active:scale-110"
                                onMouseDown={handleMouseDown}
                              >
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="whitespace-nowrap rounded-full border border-cyan-500/40 bg-[#070B18]/95 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-xl"
                                >
                                  {whiteboardWidth.toFixed(1)}% WIDTH
                                </motion.div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

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
                                scale: 1,
                                filter: "brightness(1)",
                                transition: {
                                  y: {
                                    type: "spring",
                                    stiffness: 220,
                                    damping: 24,
                                    mass: 1.8
                                  },
                                  scale: {
                                    type: "spring",
                                    stiffness: 220,
                                    damping: 24
                                  },
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
                                width: `${whiteboardWidth}%`,
                                maxHeight: "100%",
                                transformOrigin: "center right",
                                transition: "box-shadow 0.5s ease, filter 0.5s ease",
                                background: "linear-gradient(145deg, rgba(13, 14, 18, 0.8), rgba(8, 8, 10, 0.8))",
                                boxShadow: "-8px -8px 24px rgba(255,255,255,0.015), 16px 16px 40px rgba(0,0,0,0.8)"
                              }}
                              className={cn(
                                "group/ide relative min-h-[38vh] shrink-0 flex-col overflow-hidden rounded-2xl border border-black will-change-transform md:flex lg:min-h-0 lg:rounded-[48px]",
                                activeTab === "code" ? "flex size-full" : "hidden md:flex"
                              )}
                            >
                              {/* Top & Bottom Sizing Pills */}
                              <div className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 opacity-0 transition-opacity group-hover/ide:opacity-100">
                                <div className="flex h-6 items-center rounded-full border border-cyan-500/30 bg-[#070B18]/90 px-3 py-1 text-center text-[9px] font-bold uppercase tracking-widest text-cyan-400 backdrop-blur-md">
                                  {whiteboardWidth.toFixed(0)}% IDE
                                </div>
                              </div>
                              <div className="pointer-events-none absolute bottom-4 left-1/2 z-50 -translate-x-1/2 opacity-0 transition-opacity group-hover/ide:opacity-100">
                                <div className="flex h-6 items-center rounded-full border border-cyan-500/30 bg-[#070B18]/90 px-3 py-1 text-center text-[9px] font-bold uppercase tracking-widest text-cyan-400 backdrop-blur-md">
                                  COORD X: {(whiteboardWidth * 10).toFixed(0)}
                                </div>
                              </div>
                              <div className="flex-1 overflow-auto">
                                <PythonIDE
                                  initialCode={ideCode}
                                  onClose={() => setIsWhiteboardOpen(false)}
                                  onAction={handleIDEAction}
                                  language={ideLanguage}
                                  setLanguage={setIdeLanguage}
                                  highlightLines={highlightLines}
                                  errorRanges={errorRanges}
                                  errorPanel={errorPanel}
                                  uiActions={uiActions}
                                  onClearErrors={() => {
                                    setErrorRanges([])
                                    setHighlightLines([])
                                    setErrorPanel(null)
                                    setUiActions(null)
                                  }}
                                  autoRunTrigger={autoRunTrigger}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Mobile Bottom Tab Bar */}
                        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-[#0a0a0c]/90 px-6 py-2 backdrop-blur-2xl md:hidden">
                          <div className="mx-auto flex max-w-sm items-center justify-around py-1">
                            <button
                              onClick={() => setActiveTab("chat")}
                              className="group relative flex flex-col items-center gap-1 py-1 transition-all"
                            >
                              <div className={cn(
                                "flex size-10 items-center justify-center rounded-2xl transition-all duration-300",
                                activeTab === "chat"
                                  ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                  : "text-white/40 hover:bg-white/5 hover:text-white/60"
                              )}>
                                <MessageSquare className="size-5" />
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest transition-all",
                                activeTab === "chat" ? "text-cyan-400" : "text-white/30"
                              )}>Chat</span>
                              {activeTab === "chat" && (
                                <motion.div
                                  layoutId="activeTabMobile"
                                  className="absolute -bottom-1 h-0.5 w-8 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                />
                              )}
                            </button>

                            <button
                              onClick={() => setActiveTab("code")}
                              className="group relative flex flex-col items-center gap-1 py-1 transition-all"
                            >
                              <div className={cn(
                                "flex size-10 items-center justify-center rounded-2xl transition-all duration-300",
                                activeTab === "code"
                                  ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                  : "text-white/40 hover:bg-white/5 hover:text-white/60"
                              )}>
                                <Code2 className="size-5" />
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest transition-all",
                                activeTab === "code" ? "text-cyan-400" : "text-white/30"
                              )}>Code</span>
                              {activeTab === "code" && (
                                <motion.div
                                  layoutId="activeTabMobile"
                                  className="absolute -bottom-1 h-0.5 w-8 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {levelUpData && (
                <LevelUpModal
                  levelData={levelUpData}
                  onClose={() => {
                    setLevelUpData(null);
                    animate(mapOpacity, 1, { duration: 0.4 });
                  }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showFullMap && (
                <div className="progress-modal-overlay">
                  <button className="progress-modal-close" onClick={() => setShowFullMap(false)}>
                    <X className="size-6" />
                  </button>
                  <LevelMap />
                </div>
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
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                          Menu
                        </h3>
                        {dockItems.map(item => (
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
                          <div className="size-2 animate-pulse rounded-full bg-teal-400 opacity-70" />
                          <span>New Chat</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            <DebugOverlay />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
