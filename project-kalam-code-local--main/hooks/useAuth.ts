"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/browser-client";
import { useAuthContext } from "@/context/AuthContext";
import { AuthError } from "@supabase/supabase-js";

export const useAuth = () => {
    const { user, session, isLoading: contextLoading, signOut } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Email/Password Signup
     * 1. Validates input before calling Supabase Auth
     * 2. Waits for auth to complete before DB write
     * 3. Uses upsert() with onConflict to prevent 409
     * 4. Logs error.message, not the raw object
     */
    const signUp = async (email: string, password: string) => {
        // Requirement 6: Validate request body before sending
        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address.");
            return { data: null, error: { message: "Invalid email" } as AuthError };
        }
        if (!password || password.length < 6) {
            setError("Password must be at least 6 characters.");
            return { data: null, error: { message: "Weak password" } as AuthError };
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Auth signup
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            // Step 2: Only insert into DB AFTER auth is confirmed successful
            if (data.user) {
                try {
                    // Requirement 1 & 8: upsert() prevents 409 Conflict on duplicate IDs
                    // Requirement 4: Fields match DB schema (id, email, xp, level, streak_count)
                    const { error: dbError } = await supabase
                        .from('users')
                        .upsert(
                            {
                                id: data.user.id,
                                email: data.user.email,
                                xp: 0,
                                level: 1,
                                streak_count: 0,
                            },
                            { onConflict: 'id' }
                        );

                    // Requirement 3: Log error.message, not the raw object
                    if (dbError) {
                        console.error("[Auth] DB Insertion Error:", dbError.message);
                        console.error("[Auth] DB Error Details:", dbError.code, dbError.details, dbError.hint);
                    }
                } catch (dbErr: any) {
                    // Requirement 7: try/catch around DB operation
                    console.error("[Auth] DB insertion threw:", dbErr.message || dbErr);
                    // Don't block signup flow if DB write fails — auth succeeded
                }
            }

            return { data, error: null };
        } catch (err: any) {
            const msg = err.message || "An error occurred during signup";
            setError(msg);
            console.error("[Auth] Signup Error:", err.message || err);
            return { data: null, error: err as AuthError };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Email/Password Login
     * Validates input client-side before sending to Supabase
     */
    const signIn = async (email: string, password: string) => {
        // Requirement 6: Validate before sending
        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address.");
            return { data: null, error: { message: "Invalid email" } as AuthError };
        }
        if (!password || password.length < 1) {
            setError("Please enter your password.");
            return { data: null, error: { message: "Missing password" } as AuthError };
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (authError) throw authError;

            return { data, error: null };
        } catch (err: any) {
            let msg = err.message || "Invalid login credentials";

            // Provide human-readable messages for common Supabase auth errors
            if (msg.includes("Email not confirmed")) {
                msg = "Please verify your email before signing in. Check your inbox for the confirmation link.";
            } else if (msg.includes("Invalid login credentials")) {
                msg = "Incorrect email or password. Please try again.";
            }

            setError(msg);
            console.error("[Auth] SignIn Error:", err.message || err);
            return { data: null, error: err as AuthError };
        } finally {
            setLoading(false);
        }
    };

    /**
     * OAuth Provider Login (Google, Apple)
     */
    const signInWithProvider = async (provider: 'google' | 'apple') => {
        setLoading(true);
        setError(null);
        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (authError) throw authError;
        } catch (err: any) {
            const msg = err.message || `An error occurred during ${provider} sign in`;
            setError(msg);
            console.error(`[Auth] ${provider} OAuth Error:`, err.message || err);
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        session,
        isLoading: loading || contextLoading,
        error,
        signUp,
        signIn,
        signInWithProvider,
        signOut,
    };
};
