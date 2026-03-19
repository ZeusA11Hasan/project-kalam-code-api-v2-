import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const db = createClient(supabaseUrl, supabaseKey)

export interface ChatMessage {
    id?: string
    user_id: string
    conversation_id: string
    role: "user" | "assistant" | "system"
    content: string
    created_at?: string
}

export const chatDb = {
    // ── Save a single message ──────────────────────────────────────
    saveMessage: async (message: ChatMessage) => {
        const { error } = await db.from("messages").insert(message)
        if (error) {
            console.error("[ChatDB] Error saving message:", error)
        }
    },

    // ── Fetch conversation history ─────────────────────────────────
    getConversationHistory: async (
        userId: string,
        conversationId: string,
        limit: number = 20
    ) => {
        const { data, error } = await db
            .from("messages")
            .select("role, content")
            .eq("user_id", userId)
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false }) // Get newest first to limit
            .limit(limit)

        if (error) {
            console.error("[ChatDB] Error fetching history:", error)
            return []
        }

        // Reverse to get chronological order
        return data ? data.reverse() : []
    },

    // ── Update conversation summary (for memory compression) ───────
    saveSummary: async (conversationId: string, summary: string) => {
        const { error } = await db.from("summaries").upsert({
            conversation_id: conversationId,
            summary: summary,
        }, { onConflict: "conversation_id" })

        if (error) {
            console.error("[ChatDB] Error saving summary:", error)
        }
    },

    // ── Get conversation summary ───────────────────────────────────
    getSummary: async (conversationId: string) => {
        const { data, error } = await db
            .from("summaries")
            .select("summary")
            .eq("conversation_id", conversationId)
            .maybeSingle()

        if (error) {
            console.error("[ChatDB] Error fetching summary:", error)
        }

        return data?.summary || null
    }
}
