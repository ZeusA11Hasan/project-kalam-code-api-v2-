"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Timer, Terminal, Cpu, Activity, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

// --- RAW DATA ---
const RAW_SETS = {
    1: [
        { question: "What do we call a name that stores a value like x = 5?", options: ["function", "variable", "loop", "print"], answer: "variable" },
        { question: "Which Python function is used to display output?", options: ["show()", "echo()", "print()", "display()"], answer: "print()" },
        { question: "Which loop is commonly used with range()?", options: ["if", "while", "for", "switch"], answer: "for" },
        { question: "Which loop runs as long as a condition is true?", options: ["for", "while", "loop", "repeat"], answer: "while" },
        { question: "What keyword stops a loop immediately?", options: ["stop", "break", "exit", "end"], answer: "break" }
    ],
    2: [
        { question: "What is the output?\n\nx = 5\nprint(x)", options: ["x", "5", "error", "print"], answer: "5" },
        { question: "What is the output?\n\nfor i in range(3):\n    print(i)", options: ["1 2 3", "0 1 2", "0 1 2 3", "error"], answer: "0 1 2" },
        { question: "What is the output?\n\nx = 2\nx = x + 3\nprint(x)", options: ["2", "3", "5", "23"], answer: "5" },
        { question: "Choose the correct code to print 'Hello'", options: ["print Hello", "echo('Hello')", "print('Hello')", "display Hello"], answer: "print('Hello')" }
    ],
    3: [
        { question: "Fill the missing keyword:\n\nfor i in _____(5):\n    print(i)", options: ["loop", "range", "while", "print"], answer: "range" },
        { question: "Fix the code (single-line fix):\n\nprint 'Hello'", options: ["Add colon", "Add brackets", "Add range", "No change"], answer: "Add brackets" },
        { question: "Fill the missing keyword:\n\n_____ x < 5:\n    print(x)", options: ["for", "loop", "while", "if"], answer: "while" },
        { question: "Fix the code:\n\nfor i in range(5)\n    print(i)", options: ["Add :", "Add ()", "Add =", "No change"], answer: "Add :" }
    ]
};

const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const HangmanSVG = ({ errors, size = 160 }: { errors: number, size?: number }) => {
    const isLost = errors >= 6;
    return (
        <svg width={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            <AnimatePresence>
                {errors >= 1 && <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="0" y1="190" x2="200" y2="190" className="stroke-white" strokeWidth="6" strokeLinecap="round" />}
                {errors >= 2 && <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="40" y1="190" x2="40" y2="20" className="stroke-white" strokeWidth="6" strokeLinecap="round" />}
                {errors >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <motion.line x1="30" y1="40" x2="120" y2="40" className="stroke-white" strokeWidth="6" strokeLinecap="round" />
                        <motion.line x1="100" y1="40" x2="100" y2="50" className="stroke-white/40" strokeWidth="6" strokeLinecap="round" />
                    </motion.g>
                )}
            </AnimatePresence>
            <motion.g animate={isLost ? { rotate: [0, -3, 3, -3, 0] } : {}} transition={isLost ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : {}} style={{ transformOrigin: "100px 50px" }}>
                {errors >= 4 && <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} cx="100" cy="65" r="15" className="fill-white/5 stroke-white" strokeWidth="3" />}
                {errors >= 5 && <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="100" y1="80" x2="100" y2="120" className="stroke-white" strokeWidth="3" strokeLinecap="round" />}
                {errors >= 6 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <line x1="100" y1="100" x2="80" y2="80" className="stroke-white" strokeWidth="3" strokeLinecap="round" />
                        <line x1="100" y1="100" x2="120" y2="80" className="stroke-white" strokeWidth="3" strokeLinecap="round" />
                        <line x1="100" y1="120" x2="110" y2="150" className="stroke-white" strokeWidth="3" strokeLinecap="round" />
                        <line x1="100" y1="120" x2="90" y2="150" className="stroke-white" strokeWidth="3" strokeLinecap="round" />
                    </motion.g>
                )}
            </motion.g>
        </svg>
    );
};

const MinecraftHeart = ({ filled, isBreaking }: { filled: boolean; isBreaking: boolean }) => (
    <motion.div
        animate={isBreaking ? {
            scale: [1, 1.4, 0],
            opacity: [1, 1, 0],
            y: [0, -20, 0]
        } : {
            scale: filled ? 1 : 1
        }}
        transition={{ duration: 0.6 }}
        className="relative size-7 sm:size-8"
    >
        <svg viewBox="0 0 9 9" className="size-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <path d="M2 1h1v1h1V1h1v1h1V1h1v1h1v3h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1H1V2h1V1z" fill="black" />
            <path d="M2 2h1v2H2V2zm1 0h1v3H3V2zm1 1h1v3H4V3zm1-1h1v3H5V2zm1 0h1v2H6V2z"
                fill={filled ? "#FF3B30" : "#222222"}
                className="transition-colors duration-300" />
            {filled && <path d="M2 2h1v1H2V2z" fill="#FF8080" />}
        </svg>
    </motion.div>
);

export const HangmanGame: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
    const [qIndex, setQIndex] = useState(0);
    const [lives, setLives] = useState(6);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const generateRound = useCallback(() => {
        const rawFlattened = [
            ...shuffleArray(RAW_SETS[1]).slice(0, 2),
            ...shuffleArray(RAW_SETS[2]).slice(0, 2),
            ...shuffleArray(RAW_SETS[3]).slice(0, 2)
        ];

        const processed = rawFlattened.map(q => ({
            ...q,
            shuffledOptions: shuffleArray(q.options)
        }));

        return shuffleArray(processed);
    }, []);

    const startNewGame = () => {
        setLives(6);
        setScore(0);
        setQIndex(0);
        const newRound = generateRound();
        setCurrentQuestions(newRound);
        setGameState('playing');
        resetTimer();
    };

    const resetTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(10);
        setSelectedOption(null);
        setFeedback(null);
    };

    const handleNext = useCallback(() => {
        if (qIndex + 1 < currentQuestions.length) {
            setQIndex(prev => prev + 1);
            resetTimer();
        } else {
            const nextRound = generateRound();
            setCurrentQuestions(nextRound);
            setQIndex(0);
            resetTimer();
        }
    }, [qIndex, currentQuestions, generateRound]);

    const handleWrong = useCallback(() => {
        setSelectedOption('timeout');
        setLives(prev => {
            const nl = prev - 1;
            if (nl <= 0) setTimeout(() => setGameState('gameover'), 800);
            return nl;
        });
        setFeedback('wrong');
        setTimeout(handleNext, 1200);
    }, [handleNext]);

    const handleSelect = (choiceText: string) => {
        if (selectedOption || gameState !== 'playing') return;
        setSelectedOption(choiceText);

        if (currentQuestions[qIndex].answer === choiceText) {
            setFeedback('correct');
            setScore(s => s + 100);
            setTimeout(handleNext, 1000);
        } else {
            handleWrong();
        }
    };

    useEffect(() => {
        if (gameState === 'playing' && !selectedOption) {
            timerRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) { handleWrong(); return 0; }
                    return t - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, selectedOption, handleWrong]);

    if (gameState === 'start') return (
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 pb-10 pt-20">
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-white/20 to-transparent p-1 shadow-2xl backdrop-blur-3xl">
                <div className="flex flex-col items-center gap-8 rounded-[39px] bg-black/60 p-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
                            <Cpu size={12} className="text-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Neural Core v2</span>
                        </div>
                        <h1 className="font-darker-grotesque px-10 text-center text-6xl font-black uppercase leading-tight tracking-tighter text-white">Quantum Engine</h1>
                    </div>
                    <button onClick={startNewGame} className="group relative rounded-xl bg-white px-12 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-105 active:scale-95">
                        Initialize Protocol
                    </button>
                </div>
            </div>
        </div>
    );

    if (gameState === 'gameover') return (
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 pb-12 pt-20 text-center">
            <div className="flex w-full flex-col items-center gap-8 rounded-[44px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-3xl">
                <div className="flex gap-4">
                    {[...Array(6)].map((_, i) => <MinecraftHeart key={i} filled={false} isBreaking={false} />)}
                </div>
                <HangmanSVG errors={6} size={160} />
                <h2 className="font-darker-grotesque text-5xl font-black uppercase leading-none tracking-tight text-[#FF3B30]">System Offline</h2>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Final Hash Score</span>
                    <span className="font-mono text-5xl font-black text-white">{score}</span>
                </div>
                <button onClick={startNewGame} className="flex w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-white py-4 text-[10px] font-black uppercase tracking-widest text-black shadow-xl transition-all hover:bg-neutral-200 active:scale-95">
                    <RefreshCw size={16} className="stroke-[3]" /> System Reset
                </button>
            </div>
        </div>
    );

    const currentQ = currentQuestions[qIndex];

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center p-4 pb-16 pt-24">
            <div className="relative flex min-h-[550px] w-full flex-col gap-6 overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-3xl">
                <div className="pointer-events-none absolute right-0 top-0 -mr-40 -mt-40 size-80 rounded-full bg-white/[0.015] blur-[100px]" />

                <div className="relative z-10 flex shrink-0 flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={feedback === 'wrong' ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                                className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-black/40 px-3 py-1.5 backdrop-blur-md"
                            >
                                {[...Array(6)].map((_, i) => (
                                    <MinecraftHeart
                                        key={i}
                                        filled={i < lives}
                                        isBreaking={feedback === 'wrong' && i === lives}
                                    />
                                ))}
                            </motion.div>
                            <span className="text-[8px] font-black uppercase leading-none tracking-[0.2em] text-white/20">Core Interface_v3</span>
                        </div>
                        <h2 className="font-darker-grotesque text-2xl font-black uppercase leading-none tracking-wider text-white">Tactical Challenge</h2>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Total Integrity</span>
                            <span className="font-mono text-2xl font-black leading-none text-white">{score}</span>
                        </div>

                        <div className="relative flex size-14 items-center justify-center">
                            <svg className="absolute inset-0 size-full -rotate-90">
                                <circle cx="28" cy="28" r="25" className="stroke-white/5" strokeWidth="4" fill="none" />
                                <motion.circle
                                    cx="28" cy="28" r="25" className={cn("transition-colors duration-300", timeLeft <= 3 ? "stroke-[#FF3B30]" : "stroke-white/60")}
                                    strokeWidth="4" fill="none" strokeDasharray="157.08"
                                    animate={{ strokeDashoffset: 157.08 - (157.08 * timeLeft) / 10 }}
                                />
                            </svg>
                            <span className={cn("font-mono text-lg font-black tracking-tighter", timeLeft <= 3 ? "text-[#FF3B30]" : "text-white")}>{timeLeft}</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid flex-1 grid-cols-1 items-stretch gap-8 lg:grid-cols-[1fr_280px]">
                    <div className="order-2 flex h-full flex-col lg:order-1">
                        <div className="flex h-48 shrink-0 flex-col justify-start">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={qIndex}
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-emerald-500/50">
                                        <Terminal size={12} /> FE_SEGMENT_0x{qIndex.toString(16)}
                                    </div>
                                    <p className="font-darker-grotesque max-w-2xl whitespace-pre-wrap text-2xl font-bold leading-tight text-white/90 md:text-3xl">
                                        {currentQ?.question}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={qIndex}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2"
                            >
                                {currentQ?.shuffledOptions.map((optText: string, idx: number) => {
                                    const label = String.fromCharCode(65 + idx);
                                    const isCorrectValue = currentQ.answer === optText;
                                    const isSel = selectedOption === optText;

                                    let appearance = "bg-white text-black border-transparent hover:bg-zinc-50 shadow-lg";
                                    if (selectedOption) {
                                        if (isCorrectValue) appearance = "bg-[#34C759] border-[#34C759] text-white scale-[1.02] shadow-[0_0_20px_rgba(52,199,89,0.2)]";
                                        else if (isSel) appearance = "bg-[#FF3B30] border-[#FF3B30] text-white animate-shake shadow-[0_0_20px_rgba(255,59,48,0.2)]";
                                        else appearance = "opacity-20 border-transparent grayscale text-black bg-white";
                                    }

                                    return (
                                        <button key={optText} onClick={() => handleSelect(optText)} disabled={!!selectedOption} className={cn("group flex items-center gap-4 rounded-[24px] border p-5 transition-all duration-300 active:scale-95", appearance)}>
                                            <div className={cn(
                                                "flex size-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black tracking-tighter transition-all",
                                                selectedOption
                                                    ? "bg-white/20 text-white"
                                                    : "bg-[#0a0a0a] text-white shadow-[-1px_-1px_3px_rgba(255,255,255,0.15),2px_2px_5px_rgba(0,0,0,0.8)]"
                                            )}>
                                                {label}
                                            </div>
                                            <span className="font-darker-grotesque text-left text-base font-bold normal-case leading-tight tracking-wide">{optText}</span>
                                        </button>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="order-1 flex flex-col items-center justify-center self-stretch rounded-[44px] border border-white/10 bg-black/40 p-6 backdrop-blur-md lg:order-2 lg:h-full">
                        <div className="relative flex w-full flex-col items-center justify-center gap-4 py-4">
                            <HangmanSVG errors={6 - lives} size={140} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
