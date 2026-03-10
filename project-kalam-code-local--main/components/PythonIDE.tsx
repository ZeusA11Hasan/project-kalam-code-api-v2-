"use client";

import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Trash2, Save, Loader2, MessageSquare, Terminal, Zap, PanelLeftClose, Sparkles, Wand2, X, Check } from "lucide-react";
import { SidebarToggleIcon } from "./ui/sidebar-toggle-icon";
import { IconDatabase } from "@tabler/icons-react";
import { Button } from "./ui/button";
import KineticDotsLoader from "./ui/kinetic-dots-loader";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { FlipButton } from "./ui/flip-button";

declare global {
    interface Window {
        loadPyodide: any;
        pyodideInstance: any;
        SQL: any;
        dbInstance: any;
    }
}

const PythonLogo = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 255" width="16" height="16" className={className}>
        <defs>
            <linearGradient id="pyBlue" x1="12.96%" y1="12.04%" x2="79.64%" y2="78.01%">
                <stop offset="0%" stopColor="#387EB8" />
                <stop offset="100%" stopColor="#366994" />
            </linearGradient>
            <linearGradient id="pyYellow" x1="19.13%" y1="20.58%" x2="90.43%" y2="88.01%">
                <stop offset="0%" stopColor="#FFE052" />
                <stop offset="100%" stopColor="#FFC331" />
            </linearGradient>
        </defs>
        <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" fill="url(#pyBlue)" />
        <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z" fill="url(#pyYellow)" />
    </svg>
);

interface PythonIDEProps {
    initialCode?: string;
    initialMode?: 'teach' | 'review';
    onClose?: () => void;
    onAction?: (action: string, code: string, output: string) => void;
    language: 'python' | 'sql';
    setLanguage: (lang: 'python' | 'sql') => void;
}

const PremiumReviewButton = ({
    onClick,
    isActive = false
}: {
    onClick: () => void;
    isActive?: boolean;
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
            ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
        >
            {/* Indicator Dot */}
            <div className={`size-2 rounded-full transition-all duration-300 
                ${isActive
                    ? 'bg-[#8A9A5B] shadow-[0_0_15px_rgba(138, 154, 91, 0.8)] animate-pulse'
                    : 'bg-white/20 shadow-none'}`}
            />

            {/* Button Text */}
            <span
                className={`text-[10px] font-black tracking-[2px] uppercase transition-all duration-300
                    ${isActive ? 'text-[#8A9A5B] font-black' : 'text-white/40 group-hover:text-white/60'}`}
                style={{
                    textShadow: isActive ? "0 0 15px rgba(138, 154, 91, 0.6)" : "none"
                }}
            >
                REVIEW CODE
            </span>

            {/* Premium Moss Green Inner Glow */}
            <div className={`absolute inset-0 rounded-xl transition-opacity duration-500 pointer-events-none ${isActive ? 'bg-[#8A9A5B]/10 opacity-100' : 'bg-transparent opacity-0'}`} />

            {/* Moss Green Halo Effect */}
            {isActive && (
                <div className="absolute -inset-1 blur-lg bg-[#8A9A5B]/20 rounded-xl animate-pulse pointer-events-none" />
            )}
        </motion.button>
    );
};


const PremiumToolbarButton = ({
    onClick,
    label,
    icon: Icon,
    disabled,
    variant = "default"
}: {
    onClick: () => void;
    label: string;
    icon?: any;
    disabled?: boolean;
    variant?: "default" | "success";
}) => {
    const isSuccess = variant === "success";

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
            className={`group relative flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-300 ease-out 
            bg-gradient-to-br from-[#121215] to-[#0a0a0c] border border-white/[0.02] 
            shadow-[-10px_-10px_20px_rgba(255,255,255,0.02),12px_12px_24px_rgba(0,0,0,0.8)]
            active:shadow-[inset_-8px_-8px_16px_rgba(255,255,255,0.01),inset_10px_10px_20px_rgba(0,0,0,0.9)]
            hover:from-[#15151a] hover:to-[#0d0d0f]
            ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
        >
            {Icon && (
                <div className={`transition-all duration-300 ${isSuccess ? 'text-emerald-500 group-hover:text-emerald-400' : 'text-white/40 group-hover:text-white'}`}>
                    <Icon size={14} fill={isSuccess ? "currentColor" : "none"} />
                </div>
            )}
            <span
                className={`text-[10px] font-extrabold tracking-[0.12em] uppercase transition-all duration-250 ${isSuccess ? 'text-emerald-500 group-hover:text-emerald-400' : 'text-white/80 group-hover:text-white'}`}
                style={{ textShadow: "-1px -1px 0 rgba(0,0,0,0.6)" }}
            >
                {label}
            </span>
            <div className={`absolute inset-0 rounded-full transition-colors pointer-events-none ${isSuccess ? 'bg-white/0 group-hover:bg-white/[0.03]' : 'bg-white/0 group-hover:bg-white/[0.03]'}`} />
        </motion.button>
    );
};




const SqlTableRenderer = ({ data }: { data: { columns: string[], values: any[][] } }) => (
    <div className="my-6 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                        {data?.columns?.map((col, idx) => (
                            <th key={idx} className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/40">
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
                            className="hover:bg-white/[0.02] transition-colors"
                        >
                            {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="px-4 py-3 text-[13px] text-white/70 font-medium">
                                    {String(cell)}
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
        {data?.values?.length === 0 && (
            <div className="p-8 text-center text-white/20 italic text-sm">
                No rows returned
            </div>
        )}
    </div>
);

// LanguageToggle removed in favor of FlipButton which is imported from UI.

export default function PythonIDE({
    initialCode,
    onClose,
    initialMode = 'teach',
    onAction,
    language,
    setLanguage
}: PythonIDEProps) {
    const [code, setCode] = useState("# Write your Python code here\nprint('Hello, AI Tutor!')");
    const [showFlash, setShowFlash] = useState(false);
    const [aiMode, setAiMode] = useState<'teach' | 'review'>(initialMode)
    const [isAILit, setIsAILit] = useState(false)
    const [isHovering, setIsHovering] = useState(false)

    // Sync injected code from AI
    useEffect(() => {
        if (initialCode) {
            setCode(initialCode);
            // Visual "Ambient Glow" feedback for code injection
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [initialCode]);

    const [isLoading, setIsLoading] = useState(false);
    const [output, setOutput] = useState<any[]>([]); // Array of segments (text or tables)
    const editorRef = useRef(null);

    // Resizer State
    const [consoleHeight, setConsoleHeight] = useState(180);
    const [isResizingConsole, setIsResizingConsole] = useState(false);
    const dragRef = useRef({ startY: 0, startHeight: 0 });

    const startResizing = (e: React.MouseEvent) => {
        dragRef.current = { startY: e.clientY, startHeight: consoleHeight };
        setIsResizingConsole(true);
        e.preventDefault();
    };

    useEffect(() => {
        let animationFrameId: number;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingConsole) return;

            animationFrameId = requestAnimationFrame(() => {
                const deltaY = dragRef.current.startY - e.clientY;
                // Constrain height between 40px and 1200px for maximum adjustability
                const newHeight = Math.max(40, Math.min(1200, dragRef.current.startHeight + deltaY));
                setConsoleHeight(newHeight);
            });
        };

        const handleMouseUp = () => {
            setIsResizingConsole(false);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        if (isResizingConsole) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingConsole]);

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    const [isSqlReady, setIsSqlReady] = useState(false);

    const initSql = async () => {
        if (window.dbInstance) return window.dbInstance;

        try {
            // Load sql.js with wasm from public folder
            const initSqlJs = (await import('sql.js')).default;
            const SQL = await initSqlJs({
                locateFile: (file: string) => `/sql-wasm.wasm`
            });

            const db = new SQL.Database();

            // Initial Seed
            db.run(`
                CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER);
                INSERT INTO users (name, age) VALUES ('Alice', 25), ('Bob', 30), ('Charlie', 22);
            `);

            window.dbInstance = db;
            setIsSqlReady(true);
            return db;
        } catch (err) {
            console.error("SQL Initialization Error:", err);
            throw err;
        }
    };

    useEffect(() => {
        if (language === 'sql' && !isSqlReady) {
            initSql().catch(console.error);
        }
    }, [language]);

    const handleRun = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setOutput([]); // Clear previous output

        try {
            if (language === 'python') {
                if (!window.pyodideInstance) {
                    setOutput([{ type: 'text', content: "> Loading Python runtime (Pyodide)...\n" }]);
                    window.pyodideInstance = await window.loadPyodide({
                        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
                    });
                    setOutput([{ type: 'text', content: "> Runtime ready.\n" }]);
                }

                const pyodide = window.pyodideInstance;
                await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
                `);

                try {
                    await pyodide.runPythonAsync(code);
                    const stdout = await pyodide.runPythonAsync("sys.stdout.getvalue()");
                    setOutput([{ type: 'text', content: stdout || "> Program execution finished (no output)." }]);
                } catch (err: any) {
                    setOutput([{ type: 'error', content: "> Python Execution Error:\n" + err.message }]);
                }
            } else {
                // SQL Mode - Step 1: Get Query
                const query = code.trim();
                const lowerQuery = query.toLowerCase();

                if (!query) {
                    setIsLoading(false);
                    return;
                }

                // Step 2: Clear Console & Loading State
                setOutput([]);

                try {
                    // Step 6: Ensure Database Persistence
                    const db = await initSql();

                    // Support for Multiple Statements (Step 4)
                    const statements = query.split(';').map(s => s.trim()).filter(s => s.length > 0);
                    const finalOutput: any[] = [];

                    for (const stmt of statements) {
                        const sLower = stmt.toLowerCase();

                        // Step 3: Execute Logic
                        if (sLower.startsWith('select')) {
                            // Use db.exec for SELECT queries (Requirement 2)
                            const results = db.exec(stmt);

                            if (results.length > 0) {
                                results.forEach((res: any) => {
                                    finalOutput.push({
                                        type: 'table',
                                        content: res
                                    });
                                });
                            } else {
                                finalOutput.push({ type: 'text', content: "Query executed. No rows returned." });
                            }
                        } else {
                            // Use db.run for mutations (Requirement 3)
                            db.run(stmt);

                            // Detect command type for feedback
                            if (sLower.startsWith('create')) {
                                finalOutput.push({ type: 'text', content: "✔ Table created successfully." });
                            } else if (sLower.startsWith('insert')) {
                                finalOutput.push({ type: 'text', content: "✔ Row inserted successfully." });
                            } else if (sLower.startsWith('update')) {
                                finalOutput.push({ type: 'text', content: "✔ Row updated successfully." });
                            } else if (sLower.startsWith('delete')) {
                                finalOutput.push({ type: 'text', content: "✔ Row deleted successfully." });
                            } else if (sLower.startsWith('drop')) {
                                finalOutput.push({ type: 'text', content: "✔ Table dropped successfully." });
                            } else if (sLower.startsWith('alter')) {
                                finalOutput.push({ type: 'text', content: "✔ Table altered successfully." });
                            } else {
                                finalOutput.push({ type: 'text', content: "✔ Query executed successfully." });
                            }
                        }
                    }

                    setOutput(finalOutput.length > 0 ? finalOutput : [{ type: 'text', content: "✔ Execution complete." }]);

                } catch (err: any) {
                    // Step 5: Error Handling
                    console.error("SQL Execution Error:", err);
                    setOutput([{ type: 'error', content: "✖ SQL Error:\n" + err.message }]);
                }
            }
        } catch (err: any) {
            setOutput([{ type: 'error', content: "> Failed to initialize runtime: " + err.message }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset DB button logic removed - users can use code to reset.

    const handleClear = () => {
        setOutput([]);
    };

    const handleSave = () => {
        setOutput((prev) => [...prev, { type: 'text', content: "> Code saved successfully.\n" }]);
    };

    return (
        <motion.div
            className="flex flex-col h-full w-full overflow-hidden backdrop-blur-xl"
            style={{
                background: 'linear-gradient(145deg, rgba(17, 17, 20, 0.9), rgba(10, 10, 12, 0.9))',
                boxShadow: '-8px -8px 20px rgba(255,255,255,0.012), 12px 12px 30px rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.03)',
            }}
        >
            {/* 1. Header Section */}
            <div
                className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] backdrop-blur-md"
                style={{
                    background: 'linear-gradient(145deg, rgba(17, 17, 20, 0.95), rgba(12, 12, 14, 0.95))',
                    boxShadow: 'inset -2px -2px 6px rgba(255,255,255,0.008), inset 3px 3px 8px rgba(0,0,0,0.6)',
                }}
            >
                <div className="flex items-center gap-6 group pl-2">
                    <div className="relative flex items-center justify-center">
                        {/* More subtle, sophisticated red recording indicator */}
                        <div className="size-2 rounded-full bg-red-600/90 shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
                        <div className="absolute inset-0 size-2 rounded-full border border-red-500/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    </div>
                    <span className="ml-2 text-[15px] font-extrabold tracking-[0.25em] uppercase text-[#8A9A5B] transition-colors duration-500 select-none">
                        Dev Studio
                    </span>
                </div>




                {/* Right - AI Mode Button and Close */}
                <div className="flex items-center gap-4">
                    <FlipButton
                        text1="Python"
                        text2="SQL"
                        icon1={<PythonLogo />}
                        icon2={<IconDatabase size={17} stroke={2} className="text-blue-400" />}
                        isFlipped={language === 'sql'}
                        onClick={() => {
                            const val = language === 'python' ? 'sql' : 'python';
                            setLanguage(val);
                            // Set sample code based on language
                            if (val === 'sql') {
                                setCode("SELECT * FROM users LIMIT 10;");
                                setOutput([]); // Clear previous output for consistency
                            } else {
                                setCode("print('Hello from Python!')\n# Start coding here...");
                                setOutput([]);
                            }
                        }}
                    />

                    <div className="h-4 w-px bg-white/10 mx-1" />




                    {onClose && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                            className="p-2 rounded-xl text-white/40 hover:text-white transition-all bg-[#0d0d0f] border border-white/5 shadow-[-4px_-4px_10px_rgba(255,255,255,0.02),6px_6px_15px_rgba(0,0,0,0.8)] hover:shadow-[inset_-2px_-2px_8px_rgba(255,255,255,0.01),inset_4px_4px_8px_rgba(0,0,0,0.9)] flex items-center justify-center gap-1.5"
                            title="Close IDE"
                        >
                            <SidebarToggleIcon isOpen={true} isHovered={isHovering} className="size-[18px]" />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* 2. Code Editor Area */}
            <div className="relative flex-grow min-h-[100px]">
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
                        folding: true,
                    }}
                />

                {/* Ambient Magic Glow removed */}

                {/* Organic 'Deep Thought' Aura removed */}
            </div>

            <div
                className="flex items-center gap-4 px-6 py-4 border-t border-white/[0.03]"
                style={{
                    background: 'rgba(10, 10, 12, 0.95)',
                    boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.4)',
                }}
            >
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98, y: 3 }}
                    onClick={handleRun}
                    disabled={isLoading || (language === 'sql' && !isSqlReady)}
                    className="flex justify-center items-center gap-2 px-8 py-2.5 rounded-full uppercase text-[11px] font-bold tracking-[0.2em] text-white/50 transition-all duration-300 bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(0,0,0,0.2)] border-t border-l border-white/10 shadow-[-12px_-12px_25px_rgba(255,255,255,0.08),15px_15px_35px_rgba(0,0,0,1)] hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.06),12px_12px_30px_rgba(0,0,0,0.8)] active:shadow-[inset_-12px_-12px_24px_rgba(255,255,255,0.03),inset_15px_15px_35px_rgba(0,0,0,1)] hover:text-white backdrop-blur-md focus:outline-none"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {isLoading ? "Running..." : "Run Script"}
                </motion.button>

                <div className="h-6 w-px bg-white/5 mx-2" />

                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98, y: 3 }}
                    onClick={handleClear}
                    className="flex justify-center items-center gap-2 px-8 py-2.5 rounded-full uppercase text-[11px] font-bold tracking-[0.2em] text-white/50 transition-all duration-300 bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(0,0,0,0.2)] border-t border-l border-white/10 shadow-[-12px_-12px_25px_rgba(255,255,255,0.08),15px_15px_35px_rgba(0,0,0,1)] hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.06),12px_12px_30px_rgba(0,0,0,0.8)] active:shadow-[inset_-12px_-12px_24px_rgba(255,255,255,0.03),inset_15px_15px_35px_rgba(0,0,0,1)] hover:text-white backdrop-blur-md focus:outline-none"
                >
                    <Trash2 size={14} />
                    Clear
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98, y: 3 }}
                    onClick={() => {
                        setIsAILit(true);
                        setTimeout(() => setIsAILit(false), 2500);
                        onAction?.('review', code, language === 'sql' ? 'SQL Results' : (output[0]?.content || ""));
                    }}
                    className="flex justify-center items-center gap-2 px-8 py-2.5 rounded-full uppercase text-[11px] font-bold tracking-[0.2em] text-white/50 transition-all duration-300 bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-[rgba(0,0,0,0.2)] border-t border-l border-white/10 shadow-[-12px_-12px_25px_rgba(255,255,255,0.08),15px_15px_35px_rgba(0,0,0,1)] hover:shadow-[-8px_-8px_20px_rgba(255,255,255,0.06),12px_12px_30px_rgba(0,0,0,0.8)] active:shadow-[inset_-12px_-12px_24px_rgba(255,255,255,0.03),inset_15px_15px_35px_rgba(0,0,0,1)] hover:text-white ml-auto backdrop-blur-md"
                >
                    <Sparkles size={14} />
                    Review Code
                </motion.button>
            </div>

            {/* Resizer Handle (Invisible but easy to grab) */}
            <div
                className={`h-2 w-full shrink-0 cursor-row-resize relative z-20 -mb-2 ${isResizingConsole ? 'bg-transparent' : 'bg-transparent'}`}
                onMouseDown={startResizing}
            />

            <div
                style={{ height: `${consoleHeight}px` }}
                className="p-6 overflow-y-auto border-t border-white/[0.03] font-mono text-[14px] leading-relaxed group shrink-0"
            >
                <div
                    className="flex items-center gap-3 mb-4 opacity-40 group-hover:opacity-70 transition-opacity px-3 py-2 rounded-xl w-fit"
                    style={{
                        background: 'linear-gradient(145deg, rgba(17, 17, 20, 0.95), rgba(10, 10, 12, 0.95))',
                        boxShadow: '-3px -3px 8px rgba(255,255,255,0.01), 4px 4px 10px rgba(0,0,0,0.7)',
                    }}
                >
                    <Terminal size={14} className="text-white" />
                    <span className="font-extrabold uppercase tracking-[0.2em] text-[10px] text-white">Output Console</span>
                </div>
                <div className="text-emerald-400/90 whitespace-pre-wrap">
                    {output.length > 0 ? (
                        output.map((segment, i) => (
                            <div key={i}>
                                {segment.type === 'text' && (
                                    segment.content.split('\n').map((line: string, j: number) => (
                                        <div key={j} className="flex gap-3">
                                            <span className="text-white/20 select-none text-[12px]">$</span>
                                            <span>{line}</span>
                                        </div>
                                    ))
                                )}
                                {segment.type === 'table' && <SqlTableRenderer data={segment.content} />}
                                {segment.type === 'error' && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 my-2">
                                        <pre>{segment.content}</pre>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <span className="text-white/20 italic text-[12px]">
                            {isLoading
                                ? (language === 'python' ? "Initializing Python Runtime..." : "Running Query...")
                                : "Waiting for execution..."}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
