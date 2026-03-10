"use client";

import AuthCard from "./AuthCard";
import { motion } from "framer-motion";

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center p-4 md:p-8">
            {/* Split Screen Container */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="relative z-10 flex h-auto w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-2xl md:h-[650px] md:flex-row"
            >
                {/* Left Side - Overlay Card */}
                <div className="relative z-20 flex size-full items-center justify-center rounded-[2.5rem] border border-white/[0.08] bg-[#0a0a0c] shadow-[20px_0_60px_rgba(0,0,0,0.9)] md:w-1/2">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative flex size-full items-center justify-center overflow-hidden rounded-[2.5rem]"
                    >
                        {/* Inner subtle glow */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
                        <AuthCard isEmbedded={true} />
                    </motion.div>
                </div>

                {/* Right Side - Underlay Area */}
                <div className="relative z-10 flex size-full flex-col items-center justify-center p-8 text-center md:w-1/2 md:p-12">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
                        <div className="absolute left-[-10%] top-[-10%] size-[50%] animate-pulse rounded-full bg-cyan-500/20 blur-[100px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] size-[50%] animate-pulse rounded-full bg-blue-500/20 blur-[100px] delay-700" />
                    </div>

                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 space-y-6 md:pl-6"
                    >
                        <div className="mb-2 inline-flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#dbdeeb] to-white/50 shadow-lg shadow-white/10">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="size-10 text-black"
                                fill="currentColor"
                            >
                                <path d="M13.732 1.91a3.75 3.75 0 0 0-3.515.085L4.162 5.401A3.75 3.75 0 0 0 2.25 8.67v6.66a3.75 3.75 0 0 0 1.912 3.27l6.055 3.406a3.75 3.75 0 0 0 3.515.085l3.05-1.525a1.75 1.75 0 1 0-1.565-3.13l-3.05 1.525a.25.25 0 0 1-.234-.006l-6.056-3.406a.25.25 0 0 1-.127-.218V8.67a.25.25 0 0 1 .127-.218l6.056-3.406a.25.25 0 0 1 .234-.006l3.05 1.525a1.75 1.75 0 1 0 1.566-3.13l-3.05-1.525Zm-1.874 6.076a1 1 0 0 1-.344 1.372L9.5 10.566V13a1 1 0 0 1-2 0V9.434l2.986-1.791a1 1 0 0 1 1.371.343ZM18 7.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">AI Tutor</h1>
                        <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-white/40">
                            Master any subject with your personal AI mentor.
                        </p>

                        <div className="flex items-center justify-center gap-3 pt-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-black bg-gray-800">
                                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold tracking-wider text-white/80">10K+ LEARNERS</p>
                                <div className="flex text-yellow-500">
                                    {"★★★★★".split("").map((s, i) => <span key={i} className="text-[10px]">{s}</span>)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
