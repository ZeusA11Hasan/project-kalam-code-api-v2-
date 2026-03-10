/**
 * Whiteboard Session Storage
 * Manages saving and loading whiteboard sessions
 */

import { WhiteboardCommand } from '@/lib/whiteboard-parser';

export interface WhiteboardSession {
    id: string;
    name: string;
    commands: WhiteboardCommand[];
    createdAt: Date;
    updatedAt: Date;
    thumbnail?: string; // Base64 data URL
}

const STORAGE_KEY = 'ai-tutor-whiteboard-sessions';

/**
 * Save session to localStorage (offline-first)
 */
export function saveSessionLocally(session: WhiteboardSession): void {
    const sessions = getLocalSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
        sessions[existingIndex] = { ...session, updatedAt: new Date() };
    } else {
        sessions.push(session);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Get all sessions from localStorage
 */
export function getLocalSessions(): WhiteboardSession[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const sessions = JSON.parse(data);
        return sessions.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
        }));
    } catch (error) {
        console.error('Failed to load sessions:', error);
        return [];
    }
}

/**
 * Get a single session by ID
 */
export function getSessionById(id: string): WhiteboardSession | null {
    const sessions = getLocalSessions();
    return sessions.find(s => s.id === id) || null;
}

/**
 * Delete a session
 */
export function deleteSession(id: string): void {
    const sessions = getLocalSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Generate a unique ID
 */
export function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty session
 */
export function createNewSession(name?: string): WhiteboardSession {
    const now = new Date();
    return {
        id: generateSessionId(),
        name: name || `Session ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        commands: [],
        createdAt: now,
        updatedAt: now,
    };
}

// ============================================
// Supabase Integration (Optional)
// ============================================

interface SupabaseConfig {
    url: string;
    anonKey: string;
}

let supabaseClient: any = null;

/**
 * Initialize Supabase client
 */
export async function initSupabase(config: SupabaseConfig): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const { createClient } = await import('@supabase/supabase-js');
        supabaseClient = createClient(config.url, config.anonKey);
    } catch (error) {
        console.warn('Supabase not available, using localStorage only');
    }
}

/**
 * Sync sessions to Supabase
 */
export async function syncToSupabase(userId: string): Promise<void> {
    if (!supabaseClient) {
        console.warn('Supabase not initialized');
        return;
    }

    const localSessions = getLocalSessions();

    for (const session of localSessions) {
        try {
            await supabaseClient
                .from('whiteboard_sessions')
                .upsert({
                    id: session.id,
                    user_id: userId,
                    name: session.name,
                    commands: session.commands,
                    thumbnail: session.thumbnail,
                    created_at: session.createdAt.toISOString(),
                    updated_at: session.updatedAt.toISOString(),
                });
        } catch (error) {
            console.error('Failed to sync session:', session.id, error);
        }
    }
}

/**
 * Load sessions from Supabase
 */
export async function loadFromSupabase(userId: string): Promise<WhiteboardSession[]> {
    if (!supabaseClient) {
        return getLocalSessions();
    }

    try {
        const { data, error } = await supabaseClient
            .from('whiteboard_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            commands: row.commands,
            thumbnail: row.thumbnail,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        }));
    } catch (error) {
        console.error('Failed to load from Supabase:', error);
        return getLocalSessions();
    }
}

// ============================================
// Export History for Undo/Redo
// ============================================

export interface HistoryState {
    commands: WhiteboardCommand[];
    timestamp: Date;
}

export class SessionHistory {
    private history: HistoryState[] = [];
    private currentIndex: number = -1;
    private maxHistory: number;

    constructor(maxHistory: number = 50) {
        this.maxHistory = maxHistory;
    }

    push(commands: WhiteboardCommand[]): void {
        // Remove any future states if we're not at the end
        this.history = this.history.slice(0, this.currentIndex + 1);

        // Add new state
        this.history.push({
            commands: [...commands],
            timestamp: new Date(),
        });

        // Trim to max history
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
    }

    undo(): WhiteboardCommand[] | null {
        if (this.currentIndex <= 0) return null;
        this.currentIndex--;
        return [...this.history[this.currentIndex].commands];
    }

    redo(): WhiteboardCommand[] | null {
        if (this.currentIndex >= this.history.length - 1) return null;
        this.currentIndex++;
        return [...this.history[this.currentIndex].commands];
    }

    canUndo(): boolean {
        return this.currentIndex > 0;
    }

    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    clear(): void {
        this.history = [];
        this.currentIndex = -1;
    }
}
