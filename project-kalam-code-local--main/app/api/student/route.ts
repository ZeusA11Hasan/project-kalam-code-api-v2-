// ─── STUDENT PROFILE API ─────────────────────────────────────────
// GET  → Returns the full student profile for session initialization
// POST → Saves an end-of-session summary to the database
// PUT  → Updates specific profile fields (e.g., learning path)

import { NextRequest, NextResponse } from "next/server";
import { studentDb, type SessionSummary } from "@/lib/db/studentProfile";

export const runtime = "nodejs";

// GET /api/student — Fetch student profile
export async function GET(req: NextRequest) {
    try {
        const studentId = req.nextUrl.searchParams.get("id") || "default";
        const profile = studentDb.getProfile(studentId);
        const sessionCount = studentDb.getSessionCount(studentId);
        const recentSessions = studentDb.getRecentSessions(studentId, 3);

        return NextResponse.json({
            profile,
            sessionCount,
            recentSessions: recentSessions.map((s: any) => ({
                summary: s.session_summary,
                topics: safeJsonParse(s.topics_covered, []),
                confidence: s.student_confidence_signal,
                date: s.created_at,
            })),
        });
    } catch (err: any) {
        console.error("[Student API] GET Error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to load student profile" },
            { status: 500 }
        );
    }
}

// POST /api/student — Save session summary
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { studentId = "default", session } = body;

        if (!session || !session.session_summary) {
            return NextResponse.json(
                { error: "Missing session summary data" },
                { status: 400 }
            );
        }

        const summary: SessionSummary = {
            session_summary: session.session_summary,
            topics_covered: session.topics_covered || [],
            concepts_mastered: session.concepts_mastered || [],
            concepts_needing_revision: session.concepts_needing_revision || [],
            suggested_next_topic: session.suggested_next_topic || "",
            student_confidence_signal: session.student_confidence_signal || "medium",
            topic_stack: session.topic_stack || [],
        };

        studentDb.saveSession(studentId, summary);

        console.log("[Student API] Session saved:", {
            studentId,
            topics: summary.topics_covered,
            confidence: summary.student_confidence_signal,
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[Student API] POST Error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to save session" },
            { status: 500 }
        );
    }
}

// PUT /api/student — Update learning path or record explanation style
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { studentId = "default", action, data } = body;

        if (action === "updateLearningPath" && Array.isArray(data.path)) {
            studentDb.updateLearningPath(studentId, data.path);
            return NextResponse.json({ success: true });
        }

        if (action === "recordExplanationStyle" && data.topic && data.style) {
            studentDb.recordExplanationStyle(studentId, data.topic, data.style);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );
    } catch (err: any) {
        console.error("[Student API] PUT Error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to update profile" },
            { status: 500 }
        );
    }
}

// ─── HELPERS ─────────────────────────────────────────────────────
function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}
