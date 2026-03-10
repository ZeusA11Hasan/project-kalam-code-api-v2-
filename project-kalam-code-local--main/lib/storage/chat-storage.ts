/**
 * Chat History Storage
 * Stores chat messages locally and optionally syncs to Supabase
 */

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        latex?: string;
        whiteboard?: any[];
        voice?: string;
        used_rag?: boolean;
        rag_sources?: string[];
    };
}

export interface ChatSession {
    id: string;
    name: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const CHAT_STORAGE_KEY = 'ai-tutor-chat-sessions';

/**
 * Generate unique ID
 */
export function generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all chat sessions from localStorage
 */
export function getChatSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(CHAT_STORAGE_KEY);
        if (!data) return [];

        const sessions = JSON.parse(data);
        return sessions.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            messages: s.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
            })),
        }));
    } catch (error) {
        console.error('Failed to load chat sessions:', error);
        return [];
    }
}

/**
 * Get a single chat session by ID
 */
export function getChatSessionById(id: string): ChatSession | null {
    const sessions = getChatSessions();
    return sessions.find(s => s.id === id) || null;
}

/**
 * Save a chat session
 */
export function saveChatSession(session: ChatSession): void {
    const sessions = getChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);

    const updatedSession = { ...session, updatedAt: new Date() };

    if (existingIndex >= 0) {
        sessions[existingIndex] = updatedSession;
    } else {
        sessions.push(updatedSession);
    }

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Create a new chat session
 */
export function createChatSession(name?: string): ChatSession {
    const now = new Date();
    return {
        id: generateChatId(),
        name: name || `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        messages: [],
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Add a message to a chat session
 */
export function addMessageToSession(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: ChatMessage['metadata']
): ChatMessage {
    const session = getChatSessionById(sessionId);
    if (!session) {
        throw new Error(`Chat session ${sessionId} not found`);
    }

    const message: ChatMessage = {
        id: generateMessageId(),
        role,
        content,
        timestamp: new Date(),
        metadata,
    };

    session.messages.push(message);
    saveChatSession(session);

    return message;
}

/**
 * Delete a chat session
 */
export function deleteChatSession(id: string): void {
    const sessions = getChatSessions().filter(s => s.id !== id);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Get recent chat sessions (last N)
 */
export function getRecentChatSessions(limit: number = 10): ChatSession[] {
    const sessions = getChatSessions();
    return sessions
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, limit);
}

/**
 * Search chat sessions by message content
 */
export function searchChatSessions(query: string): ChatSession[] {
    const sessions = getChatSessions();
    const lowerQuery = query.toLowerCase();

    return sessions.filter(session =>
        session.name.toLowerCase().includes(lowerQuery) ||
        session.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Export chat session as JSON
 */
export function exportChatSession(id: string): string | null {
    const session = getChatSessionById(id);
    if (!session) return null;

    return JSON.stringify(session, null, 2);
}

/**
 * Import chat session from JSON
 */
export function importChatSession(jsonString: string): ChatSession | null {
    try {
        const data = JSON.parse(jsonString);
        const session: ChatSession = {
            id: generateChatId(), // Generate new ID to avoid conflicts
            name: data.name || 'Imported Chat',
            messages: (data.messages || []).map((m: any) => ({
                id: generateMessageId(),
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp || Date.now()),
                metadata: m.metadata,
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        saveChatSession(session);
        return session;
    } catch (error) {
        console.error('Failed to import chat session:', error);
        return null;
    }
}

// ============================================
// Supabase Integration (Optional)
// ============================================

let supabaseClient: any = null;

export async function initChatSupabase(url: string, anonKey: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const { createClient } = await import('@supabase/supabase-js');
        supabaseClient = createClient(url, anonKey);
    } catch (error) {
        console.warn('Supabase not available for chat storage');
    }
}

export async function syncChatToSupabase(userId: string, session: ChatSession): Promise<void> {
    if (!supabaseClient) return;

    try {
        await supabaseClient.from('chat_sessions').upsert({
            id: session.id,
            user_id: userId,
            name: session.name,
            messages: session.messages,
            created_at: session.createdAt.toISOString(),
            updated_at: session.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error('Failed to sync chat to Supabase:', error);
    }
}

export async function loadChatsFromSupabase(userId: string): Promise<ChatSession[]> {
    if (!supabaseClient) return getChatSessions();

    try {
        const { data, error } = await supabaseClient
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            messages: row.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
            })),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        }));
    } catch (error) {
        console.error('Failed to load from Supabase:', error);
        return getChatSessions();
    }
}
