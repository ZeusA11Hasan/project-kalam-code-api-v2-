"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Mail, Lock, Phone, Loader2, AlertCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface AuthCardProps {
    isEmbedded?: boolean;
}

export default function AuthCard({ isEmbedded = false }: AuthCardProps) {
    const router = useRouter();
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");

    const [isSuccess, setIsSuccess] = useState(false);
    const { signIn, signUp, signInWithProvider, isLoading, error } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSuccess(false);

        // Client-side validation before sending to Supabase
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !trimmedEmail.includes("@")) {
            return; // useAuth hook will surface the error
        }
        if (mode === "signup" && password.length < 6) {
            return; // useAuth hook will surface the error
        }
        if (mode === "signin" && !password) {
            return; // useAuth hook will surface the error
        }

        let result;
        if (mode === "signin") {
            result = await signIn(trimmedEmail, password);
        } else {
            result = await signUp(trimmedEmail, password);
        }

        if (result && !result.error) {
            // If it's signup and there's no session, email confirmation is required
            if (mode === "signup" && !result.data?.session) {
                setIsSuccess(true);
                setMode("signin");
                return;
            }
            // Hard redirect to ensure cookies are synced for middleware
            window.location.href = '/';
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-5 overflow-hidden transition-all duration-300",
                isEmbedded
                    ? "w-full h-full justify-center px-6 md:px-10"
                    : "w-full max-w-[380px] rounded-[2.5rem] px-6 py-8 bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl"
            )}
        >

            {/* Top Toggle Buttons */}
            <div className="relative flex items-center justify-center w-full bg-[#0d0d0f]/50 backdrop-blur-lg p-1 rounded-full border border-white/5">
                {/* Sliding Background Pill */}
                <motion.div
                    className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#dbdeeb] rounded-full z-0 shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
                    animate={{
                        x: mode === "signup" ? 0 : "100%",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />

                <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={cn(
                        "w-1/2 py-2 text-sm rounded-full transition-colors z-10 relative",
                        mode === "signup" ? "text-black font-bold" : "text-gray-500 hover:text-white"
                    )}
                >
                    Sign up
                </button>

                <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={cn(
                        "w-1/2 py-2 text-sm rounded-full transition-colors z-10 relative",
                        mode === "signin" ? "text-black font-bold" : "text-gray-500 hover:text-white"
                    )}
                >
                    Sign in
                </button>
            </div>

            {/* Heading */}
            <div className="relative h-8 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.h2
                        key={mode}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl font-black text-white uppercase tracking-widest absolute w-full"
                    >
                        {mode === "signin" ? "Welcome" : "Account"}
                    </motion.h2>
                </AnimatePresence>
            </div>

            {/* Error Message */}
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#0d0d0f] rounded-full px-6 py-3 flex items-start gap-3 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.01),inset_4px_4px_10px_rgba(0,0,0,0.8)] border border-red-500/10"
                    >
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                        <span className="text-red-200 text-xs font-medium leading-relaxed">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence mode="wait">
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#0d0d0f] rounded-2xl px-6 py-4 flex items-start gap-3 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.01),inset_4px_4px_10px_rgba(0,0,0,0.8)] border border-emerald-500/20"
                    >
                        <div className="bg-emerald-500/10 p-2 rounded-full ring-1 ring-emerald-500/20">
                            <Check className="text-emerald-500" size={18} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-emerald-400 text-sm font-bold">Registration Successful!</span>
                            <p className="text-emerald-100/60 text-[11px] leading-relaxed">Please check your email to verify your account before signing in.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FORMS */}
            <form onSubmit={handleSubmit} className="relative">
                <AnimatePresence mode="wait">
                    {mode === "signup" ? (
                        <motion.div
                            key="signup"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex gap-3">
                                <div className="flex-1 bg-[#0d0d0f] rounded-full px-6 py-3 text-white transition-all shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_4px_4px_10px_rgba(0,0,0,0.8)] focus-within:shadow-[inset_-1px_-1px_4px_rgba(255,255,255,0.05),inset_2px_2px_8px_rgba(0,0,0,1)]">
                                    <input
                                        className="w-full bg-transparent outline-none placeholder:text-white/20 text-xs"
                                        placeholder="First name"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>

                                <div className="flex-1 bg-[#0d0d0f] rounded-full px-6 py-3 text-white transition-all shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_4px_4px_10px_rgba(0,0,0,0.8)] focus-within:shadow-[inset_-1px_-1px_4px_rgba(255,255,255,0.05),inset_2px_2px_8px_rgba(0,0,0,1)]">
                                    <input
                                        className="w-full bg-transparent outline-none placeholder:text-white/20 text-xs"
                                        placeholder="Last name (Optional)"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-[#0d0d0f] rounded-full px-6 py-3 text-white transition-all shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_4px_4px_10px_rgba(0,0,0,0.8)] focus-within:shadow-[inset_-1px_-1px_4px_rgba(255,255,255,0.05),inset_2px_2px_8px_rgba(0,0,0,1)]">
                                <Mail size={16} className="text-white/10" />
                                <input
                                    className="w-full bg-transparent outline-none placeholder:text-white/30 text-sm"
                                    placeholder="Email Address"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-[#0d0d0f] rounded-full px-6 py-3 text-white transition-all shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_4px_4px_10px_rgba(0,0,0,0.8)] focus-within:shadow-[inset_-1px_-1px_4px_rgba(255,255,255,0.05),inset_2px_2px_8px_rgba(0,0,0,1)]">
                                <Phone size={16} className="text-white/10" />
                                <input
                                    className="w-full bg-transparent outline-none placeholder:text-white/20 text-xs"
                                    placeholder="Phone (Optional)"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-[#0d0d0f] rounded-full px-6 py-3 text-white transition-all shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_4px_4px_10px_rgba(0,0,0,0.8)] focus-within:shadow-[inset_-1px_-1px_4px_rgba(255,255,255,0.05),inset_2px_2px_8px_rgba(0,0,0,1)]">
                                <Lock size={16} className="text-white/10" />
                                <input
                                    className="w-full bg-transparent outline-none placeholder:text-white/10 text-sm"
                                    type="password"
                                    placeholder="Create Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#dbdeeb] text-black py-3.5 mt-2 rounded-full font-black uppercase text-xs tracking-widest hover:scale-[0.98] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-none relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Continue"}
                            </button>

                            <div className="text-center text-white/10 text-[10px] font-bold uppercase tracking-[4px] py-2">OR CONNECT</div>

                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => signInWithProvider('google')} className="bg-[#dbdeeb] rounded-full py-3.5 flex justify-center items-center hover:scale-[0.98] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-none">
                                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22" height="22">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                    </svg>
                                </button>

                                <button type="button" onClick={() => signInWithProvider('apple')} className="bg-[#dbdeeb] rounded-full py-3.5 flex justify-center items-center hover:scale-[0.98] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 64 64" fill="black">
                                        <path d="M47.1,31.6c-0.1-8.4,6.9-12.4,7.2-12.6c-4-5.8-10.2-6.6-12.4-6.7
                      c-5.2-0.5-10.2,3.1-12.8,3.1c-2.7,0-6.6-3-10.8-2.9c-5.5,0.1-10.6,3.2-13.5,8.1c-5.8,10-1.5,24.8,4.1,32.9c2.8,4,6.2,8.4,10.6,8.2
                      c4.3-0.2,5.9-2.6,11-2.6c5,0,6.4,2.6,11,2.5c4.5-0.1,7.4-4.1,10.1-8.2c3.2-4.7,4.5-9.3,4.6-9.5c-0.1-0-8.7-3.3-8.8-12.7
                      M40.7,12.2c2.3-2.8,3.8-6.8,3.3-10.7C40.3,1.9,36.1,4.3,33.9,7c-2.1,2.6-4,6.7-3.3,10.7C34.1,17.9,38.5,15.1,40.7,12.2z"/>
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="signin"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3 bg-[#0d0d0f] rounded-full px-6 py-3 text-white transition-all shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_4px_4px_10px_rgba(0,0,0,0.8)] focus-within:shadow-[inset_-1px_-1px_4px_rgba(255,255,255,0.05),inset_2px_2px_8px_rgba(0,0,0,1)]">
                                <Mail size={16} className="text-white/10" />
                                <input
                                    className="w-full bg-transparent outline-none placeholder:text-white/20 text-xs"
                                    placeholder="Email Address"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-[#0d0d0f] rounded-full px-6 py-3 text-white transition-all shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.02),inset_4px_4px_10px_rgba(0,0,0,0.8)] focus-within:shadow-[inset_-1px_-1px_4px_rgba(255,255,255,0.05),inset_2px_2px_8px_rgba(0,0,0,1)]">
                                <Lock size={16} className="text-white/10" />
                                <input
                                    className="w-full bg-transparent outline-none placeholder:text-white/20 text-xs"
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#dbdeeb] text-black py-3.5 mt-2 rounded-full font-black uppercase text-xs tracking-widest hover:scale-[0.98] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-none relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Sign in"}
                            </button>

                            <div className="text-center text-white/10 text-[10px] font-bold uppercase tracking-[4px] py-2">OR CONTINUE</div>

                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => signInWithProvider('google')} className="bg-[#dbdeeb] rounded-full py-3.5 flex justify-center items-center hover:scale-[0.98] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-none">
                                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22" height="22">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                    </svg>
                                </button>

                                <button type="button" onClick={() => signInWithProvider('apple')} className="bg-[#dbdeeb] rounded-full py-3.5 flex justify-center items-center hover:scale-[0.98] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 64 64" fill="black">
                                        <path d="M47.1,31.6c-0.1-8.4,6.9-12.4,7.2-12.6c-4-5.8-10.2-6.6-12.4-6.7
                      c-5.2-0.5-10.2,3.1-12.8,3.1c-2.7,0-6.6-3-10.8-2.9c-5.5,0.1-10.6,3.2-13.5,8.1c-5.8,10-1.5,24.8,4.1,32.9c2.8,4,6.2,8.4,10.6,8.2
                      c4.3-0.2,5.9-2.6,11-2.6c5,0,6.4,2.6,11,2.5c4.5-0.1,7.4-4.1,10.1-8.2c3.2-4.7,4.5-9.3,4.6-9.5c-0.1-0-8.7-3.3-8.8-12.7
                      M40.7,12.2c2.3-2.8,3.8-6.8,3.3-10.7C40.3,1.9,36.1,4.3,33.9,7c-2.1,2.6-4,6.7-3.3,10.7C34.1,17.9,38.5,15.1,40.7,12.2z"/>
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
}
