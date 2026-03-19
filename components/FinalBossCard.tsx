"use client"

import { useState } from "react";
import { Check, Copy, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FinalBossCard() {
    const [copied, setCopied] = useState(false);

    const code = `from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

model = LinearRegression()
model.fit(X, y)

print(model.predict([[6]]))  # → [12.0]`;

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="group relative my-8 overflow-hidden rounded-[24px] border border-[#FACC15]/20 bg-[#070B18] p-8 shadow-[0_0_40px_rgba(250,204,21,0.05)]"
        >
            {/* Header Badge */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-xl border-x border-b border-[#FACC15]/20 bg-[#FACC15]/10 px-4 py-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FACC15]">
                    FINAL BOSS UNLOCKED
                </span>
            </div>

            <div className="flex flex-col items-center gap-6">
                {/* Medal Icon */}
                <div className="relative mt-4">
                    <div className="absolute -inset-4 rounded-full bg-[#FACC15]/20 blur-xl transition-all group-hover:bg-[#FACC15]/30" />
                    <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-[#FACC15]/40 bg-[#1E1B1E] shadow-[inset_0_0_15px_rgba(250,204,21,0.2)]">
                        <Medal className="size-8 text-[#FACC15]" strokeWidth={1.5} />
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-xl font-bold tracking-tight text-white">AI Mastery Challenge</h3>
                    <p className="mt-2 text-sm text-white/50">Build your first predictive AI model using Linear Regression.</p>
                </div>

                {/* Code Block */}
                <div className="relative w-full rounded-xl border border-white/5 bg-[#03060F] p-4 font-mono text-[13px] leading-relaxed">
                    <pre className="overflow-x-auto text-white/90">
                        <span className="text-indigo-400">from</span> sklearn.linear_model <span className="text-indigo-400">import</span> LinearRegression{"\n"}
                        <span className="text-indigo-400">import</span> numpy <span className="text-indigo-400">as</span> np{"\n"}
                        {"\n"}
                        X = np.array([[<span className="text-amber-300">1</span>], [<span className="text-amber-300">2</span>], [<span className="text-amber-300">3</span>], [<span className="text-amber-300">4</span>], [<span className="text-amber-300">5</span>]]){"\n"}
                        y = np.array([<span className="text-amber-300">2</span>, <span className="text-amber-300">4</span>, <span className="text-amber-300">6</span>, <span className="text-amber-300">8</span>, <span className="text-amber-300">10</span>]){"\n"}
                        {"\n"}
                        model = LinearRegression(){"\n"}
                        model.fit(X, y){"\n"}
                        {"\n"}
                        <span className="text-teal-400">print</span>(model.predict([[<span className="text-amber-300">6</span>]]))  <span className="text-white/30"># → [12.0]</span>
                    </pre>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="absolute bottom-3 right-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition-all hover:border-[#FACC15]/30 hover:bg-[#FACC15]/10 hover:text-[#FACC15]/90 active:scale-95"
                    >
                        <AnimatePresence mode="wait">
                            {copied ? (
                                <motion.span
                                    key="check"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    className="flex items-center gap-1.5 text-[#22C55E]"
                                >
                                    <Check className="size-3" /> Memorized
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="copy"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <Copy className="size-3" /> Copy & Memorize
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
