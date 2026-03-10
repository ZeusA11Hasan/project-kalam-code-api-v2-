"use client"

import React, { useState, useRef, useEffect } from "react"
import Editor from "@monaco-editor/react"
import {
  Play,
  Trash2,
  Save,
  Loader2,
  MessageSquare,
  Terminal,
  Zap,
  PanelLeftClose,
  Sparkles,
  Wand2,
  X,
  Check
} from "lucide-react"
import { SidebarToggleIcon } from "./ui/sidebar-toggle-icon"
import { IconDatabase } from "@tabler/icons-react"
import { Button } from "./ui/button"
import KineticDotsLoader from "./ui/kinetic-dots-loader"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { FlipButton } from "./ui/flip-button"

declare global {
  interface Window {
    loadPyodide: any
    pyodideInstance: any
    SQL: any
    dbInstance: any
  }
}

const PythonLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 255"
    width="16"
    height="16"
    className={className}
  >
    <defs>
      <linearGradient
        id="pyBlue"
        x1="12.96%"
        y1="12.04%"
        x2="79.64%"
        y2="78.01%"
      >
        <stop offset="0%" stopColor="#387EB8" />
        <stop offset="100%" stopColor="#366994" />
      </linearGradient>
      <linearGradient
        id="pyYellow"
        x1="19.13%"
        y1="20.58%"
        x2="90.43%"
        y2="88.01%"
      >
        <stop offset="0%" stopColor="#FFE052" />
        <stop offset="100%" stopColor="#FFC331" />
      </linearGradient>
    </defs>
    <path
      d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z"
      fill="url(#pyBlue)"
    />
    <path
      d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z"
      fill="url(#pyYellow)"
    />
  </svg>
)

interface PythonIDEProps {
  initialCode?: string
  initialMode?: "teach" | "review"
  onClose?: () => void
  onAction?: (action: string, code: string, output: string) => void
  language: "python" | "sql"
  setLanguage: (lang: "python" | "sql") => void
}

const PremiumReviewButton = ({
  onClick,
  isActive = false
}: {
  onClick: () => void
  isActive?: boolean
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98, y: 3 }}
      animate={{
        y: isActive ? 2 : 0,
        backgroundColor: isActive ? "rgba(138, 154, 91, 0.05)" : "#0f0f12",
        boxShadow: isActive
          ? "inset -4px -4px 10px rgba(255,255,255,0.01), inset 6px 6px 12px rgba(0,0,0,0.8)"
          : "-6px -6px 15px rgba(255,255,255,0.02), 8px 8px 20px rgba(0,0,0,0.7)"
      }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`group relative flex h-[34px] w-[160px] items-center justify-center gap-2 rounded-xl border border-white/5 transition-opacity duration-300
            ${isActive ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
    >
      {/* Indicator Dot */}
      <div
        className={`size-2 rounded-full transition-all duration-300 
                ${
                  isActive
                    ? "shadow-[0_0_15px_rgba(138, 154, 91, 0.8)] animate-pulse bg-[#8A9A5B]"
                    : "bg-white/20 shadow-none"
                }`}
      />

      {/* Button Text */}
      <span
        className={`text-[10px] font-black uppercase tracking-[2px] transition-all duration-300
                    ${isActive ? "font-black text-[#8A9A5B]" : "text-white/40 group-hover:text-white/60"}`}
        style={{
          textShadow: isActive ? "0 0 15px rgba(138, 154, 91, 0.6)" : "none"
        }}
      >
        REVIEW CODE
      </span>

      {/* Premium Moss Green Inner Glow */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-500 ${isActive ? "bg-[#8A9A5B]/10 opacity-100" : "bg-transparent opacity-0"}`}
      />

      {/* Moss Green Halo Effect */}
      {isActive && (
        <div className="pointer-events-none absolute -inset-1 animate-pulse rounded-xl bg-[#8A9A5B]/20 blur-lg" />
      )}
    </motion.button>
  )
}

const PremiumToolbarButton = ({
  onClick,
  label,
  icon: Icon,
  disabled,
  variant = "default"
}: {
  onClick: () => void
  label: string
  icon?: any
  disabled?: boolean
  variant?: "default" | "success"
}) => {
  const isSuccess = variant === "success"

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98, y: 3 }}
      initial={false}
      animate={{
        y: 0,
        boxShadow: "0 10px 20px -5px rgba(0,0,0,0.5)"
      }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`group relative flex items-center gap-1.5 rounded-full border border-white/[0.02] bg-gradient-to-br from-[#121215] to-[#0a0a0c] 
            px-4 py-1.5 shadow-[-10px_-10px_20px_rgba(255,255,255,0.02),12px_12px_24px_rgba(0,0,0,0.8)] transition-all duration-300 
            ease-out
            hover:from-[#15151a]
            hover:to-[#0d0d0f] active:shadow-[inset_-8px_-8px_16px_rgba(255,255,255,0.01),inset_10px_10px_20px_rgba(0,0,0,0.9)]
            ${disabled ? "cursor-not-allowed opacity-50 shadow-none" : ""}`}
    >
      {Icon && (
        <div
          className={`transition-all duration-300 ${isSuccess ? "text-emerald-500 group-hover:text-emerald-400" : "text-white/40 group-hover:text-white"}`}
        >
          <Icon size={14} fill={isSuccess ? "currentColor" : "none"} />
        </div>
      )}
      <span
        className={`duration-250 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-all ${isSuccess ? "text-emerald-500 group-hover:text-emerald-400" : "text-white/80 group-hover:text-white"}`}
        style={{ textShadow: "-1px -1px 0 rgba(0,0,0,0.6)" }}
      >
        {label}
      </span>
      <div
        className={`pointer-events-none absolute inset-0 rounded-full transition-colors ${isSuccess ? "bg-white/0 group-hover:bg-white/[0.03]" : "bg-white/0 group-hover:bg-white/[0.03]"}`}
      />
    </motion.button>
  )
}

const SqlTableRenderer = ({
  data
}: {
  data: { columns: string[]; values: any[][] }
}) => (
  <div className="my-6 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
    <div className="custom-scrollbar-thin overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {data?.columns?.map((col, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/40"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data?.values?.map((row, rowIdx) => (
            <motion.tr
              key={rowIdx}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIdx * 0.03 }}
              className="transition-colors hover:bg-white/[0.02]"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 text-[13px] font-medium text-white/70"
                >
                  {String(cell)}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
    {data?.values?.length === 0 && (
      <div className="p-8 text-center text-sm italic text-white/20">
        No rows returned
      </div>
    )}
  </div>
)

// LanguageToggle removed in favor of FlipButton which is imported from UI.

export default function PythonIDE({
  initialCode,
  onClose,
  initialMode = "teach",
  onAction,
  language,
  setLanguage
}: PythonIDEProps) {
  const [code, setCode] = useState(
    "# Write your Python code here\nprint('Hello, AI Tutor!')"
  )
  const [showFlash, setShowFlash] = useState(false)
  const [aiMode, setAiMode] = useState<"teach" | "review">(initialMode)
  const [isAILit, setIsAILit] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [output, setOutput] = useState<any[]>([]) // Array of segments (text or tables)
  const editorRef = useRef(null)

  // --- Inline Terminal Input State ---
  const [isWaitingForInput, setIsWaitingForInput] = useState(false)
  const [inputPrompt, setInputPrompt] = useState("")
  const [inputValue, setInputValue] = useState("")
  const inputResolverRef = useRef<((value: string) => void) | null>(null)
  const inputFieldRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Auto-focus the inline input field when it appears
  useEffect(() => {
    if (isWaitingForInput && inputFieldRef.current) {
      inputFieldRef.current.focus()
    }
  }, [isWaitingForInput])

  // Auto-scroll terminal to bottom when output changes or input appears
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output, isWaitingForInput])

  // Handle inline input submission (Enter key)
  const handleInputSubmit = () => {
    if (inputResolverRef.current) {
      const value = inputValue
      // Show prompt + typed answer in terminal like real stdin
      setOutput(prev => [
        ...prev,
        { type: "text", content: inputPrompt + value }
      ])
      inputResolverRef.current(value)
      inputResolverRef.current = null
      setInputValue("")
      setIsWaitingForInput(false)
      setInputPrompt("")
    }
  }

  // Cleanup window globals on unmount
  useEffect(() => {
    return () => {
      delete (window as any).__pyodideRequestInput
      delete (window as any).__pyodideFlushOutput
    }
  }, [])

  // Sync injected code from AI
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode)
      // Visual "Ambient Glow" feedback for code injection
      setShowFlash(true)
      const timer = setTimeout(() => setShowFlash(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [initialCode])

  // Resizer State
  const [consoleHeight, setConsoleHeight] = useState(180)
  const [isResizingConsole, setIsResizingConsole] = useState(false)
  const dragRef = useRef({ startY: 0, startHeight: 0 })

  const startResizing = (e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startHeight: consoleHeight }
    setIsResizingConsole(true)
    e.preventDefault()
  }

  useEffect(() => {
    let animationFrameId: number

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingConsole) return

      animationFrameId = requestAnimationFrame(() => {
        const deltaY = dragRef.current.startY - e.clientY
        // Constrain height between 40px and 1200px for maximum adjustability
        const newHeight = Math.max(
          40,
          Math.min(1200, dragRef.current.startHeight + deltaY)
        )
        setConsoleHeight(newHeight)
      })
    }

    const handleMouseUp = () => {
      setIsResizingConsole(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    if (isResizingConsole) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "row-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingConsole])

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  const [isSqlReady, setIsSqlReady] = useState(false)

  const initSql = async () => {
    if (window.dbInstance) return window.dbInstance

    try {
      // Load sql.js with wasm from public folder
      const initSqlJs = (await import("sql.js")).default
      const SQL = await initSqlJs({
        locateFile: (file: string) => `/sql-wasm.wasm`
      })

      const db = new SQL.Database()

      // Initial Seed
      db.run(`
                CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER);
                INSERT INTO users (name, age) VALUES ('Alice', 25), ('Bob', 30), ('Charlie', 22);
            `)

      window.dbInstance = db
      setIsSqlReady(true)
      return db
    } catch (err) {
      console.error("SQL Initialization Error:", err)
      throw err
    }
  }

  useEffect(() => {
    if (language === "sql" && !isSqlReady) {
      initSql().catch(console.error)
    }
  }, [language])

  const handleRun = async () => {
    if (isLoading) return

    setIsLoading(true)
    setOutput([]) // Clear previous output

    try {
      if (language === "python") {
        if (!window.pyodideInstance) {
          setOutput([
            { type: "text", content: "> Loading Python runtime (Pyodide)...\n" }
          ])
          window.pyodideInstance = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
          })

          // One-time setup: JS bridges for inline terminal input
          ;(window as any).__pyodideRequestInput = (
            prompt: string
          ): Promise<string> => {
            return new Promise(resolve => {
              inputResolverRef.current = resolve
              setInputPrompt(prompt)
              setIsWaitingForInput(true)
            })
          }

          ;(window as any).__pyodideFlushOutput = (text: string) => {
            if (text) {
              setOutput(prev => [...prev, { type: "text", content: text }])
            }
          }

          // Python-side: async input function that bridges to React UI
          await window.pyodideInstance.runPythonAsync(`
import builtins
from js import window

async def __async_input(msg=""):
    import sys
    # Flush any accumulated print() output so it appears before the input prompt
    if hasattr(sys.stdout, 'getvalue'):
        acc = sys.stdout.getvalue()
        if acc:
            window.__pyodideFlushOutput(acc)
            sys.stdout.truncate(0)
            sys.stdout.seek(0)
    # Request input from the inline terminal UI (returns JS Promise)
    result = await window.__pyodideRequestInput(str(msg))
    if result is None:
        result = ""
    return str(result)
                    `)

          setOutput([{ type: "text", content: "> Runtime ready.\n" }])
        }

        const pyodide = window.pyodideInstance
        await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
                `)

        try {
          // Transform code for async input if it uses input()
          let codeToRun = code
          if (/\binput\s*\(/.test(code)) {
            const transformed = code.replace(
              /\binput\s*\(/g,
              "await __async_input("
            )
            const indented = transformed
              .split("\n")
              .map((line: string) => "    " + line)
              .join("\n")
            codeToRun = `async def __user_main__():\n${indented}\n\nawait __user_main__()`
          }

          await pyodide.runPythonAsync(codeToRun)

          // Read any remaining stdout after execution completes
          const remaining = await pyodide.runPythonAsync(
            "sys.stdout.getvalue()"
          )
          if (remaining && remaining.trim()) {
            setOutput(prev => [...prev, { type: "text", content: remaining }])
          }

          // If nothing was output at all, show completion message
          setOutput(prev =>
            prev.length === 0
              ? [
                  {
                    type: "text",
                    content: "> Program execution finished (no output)."
                  }
                ]
              : prev
          )
        } catch (err: any) {
          // Cancel any pending input on error
          setIsWaitingForInput(false)
          setInputPrompt("")
          setInputValue("")
          inputResolverRef.current = null

          let errorMsg = err.message
          if (
            errorMsg.includes("'await' outside") ||
            errorMsg.includes("await")
          ) {
            // Check if it's the async function limitation
            if (
              errorMsg.includes("non-async") ||
              errorMsg.includes("outside function")
            ) {
              errorMsg +=
                "\n\n\ud83d\udca1 Tip: input() inside nested def functions is not yet supported. Move input() to the top level of your code."
            }
          }
          setOutput(prev => [
            ...prev,
            { type: "error", content: "> Python Execution Error:\n" + errorMsg }
          ])
        }
      } else {
        // SQL Mode - Step 1: Get Query
        const query = code.trim()
        const lowerQuery = query.toLowerCase()

        if (!query) {
          setIsLoading(false)
          return
        }

        // Step 2: Clear Console & Loading State
        setOutput([])

        try {
          // Step 6: Ensure Database Persistence
          const db = await initSql()

          // Support for Multiple Statements (Step 4)
          const statements = query
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0)
          const finalOutput: any[] = []

          for (const stmt of statements) {
            const sLower = stmt.toLowerCase()

            // Step 3: Execute Logic
            if (sLower.startsWith("select")) {
              // Use db.exec for SELECT queries (Requirement 2)
              const results = db.exec(stmt)

              if (results.length > 0) {
                results.forEach((res: any) => {
                  finalOutput.push({
                    type: "table",
                    content: res
                  })
                })
              } else {
                finalOutput.push({
                  type: "text",
                  content: "Query executed. No rows returned."
                })
              }
            } else {
              // Use db.run for mutations (Requirement 3)
              db.run(stmt)

              // Detect command type for feedback
              if (sLower.startsWith("create")) {
                finalOutput.push({
                  type: "text",
                  content: "✔ Table created successfully."
                })
              } else if (sLower.startsWith("insert")) {
                finalOutput.push({
                  type: "text",
                  content: "✔ Row inserted successfully."
                })
              } else if (sLower.startsWith("update")) {
                finalOutput.push({
                  type: "text",
                  content: "✔ Row updated successfully."
                })
              } else if (sLower.startsWith("delete")) {
                finalOutput.push({
                  type: "text",
                  content: "✔ Row deleted successfully."
                })
              } else if (sLower.startsWith("drop")) {
                finalOutput.push({
                  type: "text",
                  content: "✔ Table dropped successfully."
                })
              } else if (sLower.startsWith("alter")) {
                finalOutput.push({
                  type: "text",
                  content: "✔ Table altered successfully."
                })
              } else {
                finalOutput.push({
                  type: "text",
                  content: "✔ Query executed successfully."
                })
              }
            }
          }

          setOutput(
            finalOutput.length > 0
              ? finalOutput
              : [{ type: "text", content: "✔ Execution complete." }]
          )
        } catch (err: any) {
          // Step 5: Error Handling
          console.error("SQL Execution Error:", err)
          setOutput([
            { type: "error", content: "✖ SQL Error:\n" + err.message }
          ])
        }
      }
    } catch (err: any) {
      setOutput([
        {
          type: "error",
          content: "> Failed to initialize runtime: " + err.message
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Reset DB button logic removed - users can use code to reset.

  const handleClear = () => {
    setOutput([])
    // Cancel any pending input
    if (inputResolverRef.current) {
      inputResolverRef.current("")
      inputResolverRef.current = null
    }
    setIsWaitingForInput(false)
    setInputPrompt("")
    setInputValue("")
  }

  const handleSave = () => {
    setOutput(prev => [
      ...prev,
      { type: "text", content: "> Code saved successfully.\n" }
    ])
  }

  return (
    <motion.div
      className="flex size-full flex-col overflow-hidden backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(145deg, rgba(17, 17, 20, 0.9), rgba(10, 10, 12, 0.9))",
        boxShadow:
          "-8px -8px 20px rgba(255,255,255,0.012), 12px 12px 30px rgba(0,0,0,0.9)",
        border: "1px solid rgba(255,255,255,0.03)"
      }}
    >
      {/* 1. Header Section */}
      <div
        className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4 backdrop-blur-md"
        style={{
          background:
            "linear-gradient(145deg, rgba(17, 17, 20, 0.95), rgba(12, 12, 14, 0.95))",
          boxShadow:
            "inset -2px -2px 6px rgba(255,255,255,0.008), inset 3px 3px 8px rgba(0,0,0,0.6)"
        }}
      >
        <div className="group flex items-center gap-6 pl-2">
          <div className="relative flex items-center justify-center">
            {/* More subtle, sophisticated red recording indicator */}
            <div className="size-2 rounded-full bg-red-600/90 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
            <div className="absolute inset-0 size-2 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-red-500/30" />
          </div>
          <span className="ml-2 select-none text-[15px] font-extrabold uppercase tracking-[0.25em] text-[#8A9A5B] transition-colors duration-500">
            Dev Studio
          </span>
        </div>

        {/* Right - AI Mode Button and Close */}
        <div className="flex items-center gap-4">
          <FlipButton
            text1="Python"
            text2="SQL"
            icon1={<PythonLogo />}
            icon2={
              <IconDatabase size={17} stroke={2} className="text-blue-400" />
            }
            isFlipped={language === "sql"}
            onClick={() => {
              const val = language === "python" ? "sql" : "python"
              setLanguage(val)
              // Set sample code based on language
              if (val === "sql") {
                setCode("SELECT * FROM users LIMIT 10;")
                setOutput([]) // Clear previous output for consistency
              } else {
                setCode("print('Hello from Python!')\n# Start coding here...")
                setOutput([])
              }
            }}
          />

          <div className="mx-1 h-4 w-px bg-white/10" />

          {onClose && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-[#0d0d0f] p-2 text-white/40 shadow-[-4px_-4px_10px_rgba(255,255,255,0.02),6px_6px_15px_rgba(0,0,0,0.8)] transition-all hover:text-white hover:shadow-[inset_-2px_-2px_8px_rgba(255,255,255,0.01),inset_4px_4px_8px_rgba(0,0,0,0.9)]"
              title="Close IDE"
            >
              <SidebarToggleIcon
                isOpen={true}
                isHovered={isHovering}
                className="size-[18px]"
              />
            </motion.button>
          )}
        </div>
      </div>

      {/* 2. Code Editor Area */}
      <div className="relative min-h-[100px] grow">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value: string | undefined) => setCode(value || "")}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            smoothScrolling: true,
            padding: { top: 20, bottom: 20 },
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true
          }}
        />

        {/* Ambient Magic Glow removed */}

        {/* Organic 'Deep Thought' Aura removed */}
      </div>

      <div
        className="flex items-center gap-4 border-t border-white/[0.03] px-6 py-4"
        style={{
          background: "rgba(10, 10, 12, 0.95)",
          boxShadow: "inset 0 10px 20px rgba(0,0,0,0.4)"
        }}
      >
        <Button
          variant="neumorphic"
          size="sm"
          onClick={handleRun}
          disabled={isLoading || (language === "sql" && !isSqlReady)}
          className="gap-2 px-6 py-2.5"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {isLoading ? "Running..." : "Run Script"}
        </Button>

        <div className="mx-2 h-6 w-px bg-white/5" />

        <Button
          variant="neumorphic"
          size="sm"
          onClick={handleClear}
          className="gap-2 px-6 py-2.5"
        >
          <Trash2 size={14} />
          Clear
        </Button>

        <Button
          variant="neumorphic"
          size="sm"
          onClick={() => {
            setIsAILit(true)
            setTimeout(() => setIsAILit(false), 2500)
            onAction?.(
              "review",
              code,
              language === "sql" ? "SQL Results" : output[0]?.content || ""
            )
          }}
          className="ml-auto gap-2 px-6 py-2.5"
        >
          <Sparkles size={14} />
          Review Code
        </Button>
      </div>

      {/* Resizer Handle (Invisible but easy to grab) */}
      <div
        className={`relative z-20 -mb-2 h-2 w-full shrink-0 cursor-row-resize ${isResizingConsole ? "bg-transparent" : "bg-transparent"}`}
        onMouseDown={startResizing}
      />

      <div
        ref={terminalRef}
        style={{ height: `${consoleHeight}px` }}
        className="group shrink-0 overflow-y-auto border-t border-white/[0.03] p-6 font-mono text-[14px] leading-relaxed"
      >
        <div
          className="mb-4 flex w-fit items-center gap-3 rounded-xl px-3 py-2 opacity-40 transition-opacity group-hover:opacity-70"
          style={{
            background:
              "linear-gradient(145deg, rgba(17, 17, 20, 0.95), rgba(10, 10, 12, 0.95))",
            boxShadow:
              "-3px -3px 8px rgba(255,255,255,0.01), 4px 4px 10px rgba(0,0,0,0.7)"
          }}
        >
          <Terminal size={14} className="text-white" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white">
            Output Console
          </span>
        </div>
        <div className="whitespace-pre-wrap text-emerald-400/90">
          {output.length > 0 ? (
            output.map((segment, i) => (
              <div key={i}>
                {segment.type === "text" &&
                  segment.content.split("\n").map((line: string, j: number) => (
                    <div key={j} className="flex gap-3">
                      <span className="select-none text-[12px] text-white/20">
                        $
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                {segment.type === "table" && (
                  <SqlTableRenderer data={segment.content} />
                )}
                {segment.type === "error" && (
                  <div className="my-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                    <pre>{segment.content}</pre>
                  </div>
                )}
              </div>
            ))
          ) : (
            <span className="text-[12px] italic text-white/20">
              {isLoading
                ? language === "python"
                  ? "Initializing Python Runtime..."
                  : "Running Query..."
                : "Waiting for execution..."}
            </span>
          )}

          {/* Inline Terminal Input — appears when Python calls input() */}
          {isWaitingForInput && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-1 flex items-center gap-3"
            >
              <span className="select-none text-[12px] text-white/20">$</span>
              <span className="whitespace-pre text-[14px] text-yellow-400/80">
                {inputPrompt}
              </span>
              <input
                ref={inputFieldRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleInputSubmit()
                  }
                }}
                className="flex-1 border-none bg-transparent font-mono text-[14px] text-emerald-400 outline-none placeholder:text-emerald-400/20"
                style={{ caretColor: "#34d399" }}
                autoFocus
                placeholder="type here, press Enter..."
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
