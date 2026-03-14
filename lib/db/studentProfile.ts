// ─── STUDENT PROFILE — PERSISTENT MEMORY ENGINE ─────────────────
// Migrated from better-sqlite3 to Supabase Postgres.
// Uses Supabase for storing and retrieving student learning data
// across sessions. This is the "brain" that makes the tutor adaptive.

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const db = createClient(supabaseUrl, supabaseKey)

// ─── TYPES ───────────────────────────────────────────────────────

export interface StudentProfile {
  id: string
  display_name: string
  current_learning_path: string[]
  past_topics: string[]
  concepts_mastered: string[]
  concepts_needing_revision: string[]
  last_session_summary: string | null
  suggested_next_topic: string | null
  topic_stack: string[]
  explanation_styles_used: Record<string, string[]>
  student_confidence_signal: string
}

export interface SessionSummary {
  session_summary: string
  topics_covered: string[]
  concepts_mastered: string[]
  concepts_needing_revision: string[]
  suggested_next_topic: string
  student_confidence_signal: "high" | "medium" | "low"
  topic_stack: string[]
}

// ─── OPERATIONS ──────────────────────────────────────────────────

export const studentDb = {
  // ── Ensure default profile exists ──────────────────────────────
  ensureProfile: async (
    studentId: string = "default",
    name: string = "Student"
  ) => {
    const { data: existing } = await db
      .from("student_profiles")
      .select("id")
      .eq("id", studentId)
      .maybeSingle()

    if (!existing) {
      await db
        .from("student_profiles")
        .insert({ id: studentId, display_name: name })
    }
  },

  // ── Get full student profile (aggregated from all tables) ──────
  getProfile: async (
    studentId: string = "default"
  ): Promise<StudentProfile> => {
    await studentDb.ensureProfile(studentId)

    const [
      { data: profile },
      { data: lastSession },
      { data: allSessions },
      { data: masteryRows }
    ] = await Promise.all([
      db.from("student_profiles").select("*").eq("id", studentId).single(),
      db
        .from("session_history")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("session_history")
        .select("topics_covered")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20),
      db.from("topic_mastery").select("*").eq("student_id", studentId)
    ])

    const pastTopics = new Set<string>()
    if (allSessions) {
      for (const session of allSessions) {
        try {
          const topics =
            typeof session.topics_covered === "string"
              ? JSON.parse(session.topics_covered)
              : session.topics_covered || []
          topics.forEach((t: string) => pastTopics.add(t))
        } catch {}
      }
    }

    const conceptsMastered: string[] = []
    const conceptsNeedingRevision: string[] = []
    const explanationStylesUsed: Record<string, string[]> = {}

    if (masteryRows) {
      for (const row of masteryRows) {
        if (row.mastery_level === "mastered") {
          conceptsMastered.push(row.topic)
        } else if (
          row.mastery_level === "struggling" ||
          row.mastery_level === "learning"
        ) {
          conceptsNeedingRevision.push(row.topic)
        }
        try {
          explanationStylesUsed[row.topic] =
            typeof row.explanation_styles_used === "string"
              ? JSON.parse(row.explanation_styles_used)
              : row.explanation_styles_used || []
        } catch {
          explanationStylesUsed[row.topic] = []
        }
      }
    }

    return {
      id: profile?.id || studentId,
      display_name: profile?.display_name || "Student",
      current_learning_path:
        typeof profile?.current_learning_path === "string"
          ? safeJsonParse(profile?.current_learning_path, [])
          : profile?.current_learning_path || [],
      past_topics: Array.from(pastTopics),
      concepts_mastered: conceptsMastered,
      concepts_needing_revision: conceptsNeedingRevision,
      last_session_summary: lastSession?.session_summary || null,
      suggested_next_topic: lastSession?.suggested_next_topic || null,
      topic_stack:
        typeof lastSession?.topic_stack === "string"
          ? safeJsonParse(lastSession?.topic_stack, [])
          : lastSession?.topic_stack || [],
      explanation_styles_used: explanationStylesUsed,
      student_confidence_signal:
        lastSession?.student_confidence_signal || "medium"
    }
  },

  // ── Save end-of-session summary ────────────────────────────────
  saveSession: async (
    studentId: string = "default",
    summary: SessionSummary
  ) => {
    await studentDb.ensureProfile(studentId)

    await db.from("session_history").insert({
      student_id: studentId,
      session_summary: summary.session_summary,
      topics_covered: JSON.stringify(summary.topics_covered),
      concepts_mastered: JSON.stringify(summary.concepts_mastered),
      concepts_needing_revision: JSON.stringify(
        summary.concepts_needing_revision
      ),
      suggested_next_topic: summary.suggested_next_topic,
      student_confidence_signal: summary.student_confidence_signal,
      topic_stack: JSON.stringify(summary.topic_stack)
    })

    // Update topic mastery records
    for (const topic of summary.concepts_mastered) {
      await db.from("topic_mastery").upsert(
        {
          student_id: studentId,
          topic: topic,
          mastery_level: "mastered",
          last_seen_at: new Date().toISOString()
        },
        { onConflict: "student_id,topic" }
      ) // Requires unique constraint on (student_id, topic)
    }

    for (const topic of summary.concepts_needing_revision) {
      const { data: existing } = await db
        .from("topic_mastery")
        .select("times_revised")
        .eq("student_id", studentId)
        .eq("topic", topic)
        .maybeSingle()
      const timesRevised = (existing?.times_revised || 0) + 1
      await db.from("topic_mastery").upsert(
        {
          student_id: studentId,
          topic: topic,
          mastery_level: "struggling",
          times_revised: timesRevised,
          last_seen_at: new Date().toISOString()
        },
        { onConflict: "student_id,topic" }
      )
    }

    await db
      .from("student_profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", studentId)
  },

  // ── Record which explanation style was used for a topic ────────
  recordExplanationStyle: async (
    studentId: string = "default",
    topic: string,
    style: string
  ) => {
    await studentDb.ensureProfile(studentId)

    const { data: row } = await db
      .from("topic_mastery")
      .select("explanation_styles_used")
      .eq("student_id", studentId)
      .eq("topic", topic)
      .maybeSingle()

    let styles: string[] = []
    if (row) {
      styles =
        typeof row.explanation_styles_used === "string"
          ? safeJsonParse(row.explanation_styles_used, [])
          : row.explanation_styles_used || []
      if (!styles.includes(style)) {
        styles.push(style)
      }
      await db
        .from("topic_mastery")
        .update({ explanation_styles_used: JSON.stringify(styles) })
        .eq("student_id", studentId)
        .eq("topic", topic)
    } else {
      await db.from("topic_mastery").insert({
        student_id: studentId,
        topic: topic,
        mastery_level: "learning",
        explanation_styles_used: JSON.stringify([style]),
        last_seen_at: new Date().toISOString()
      })
    }
  },

  // ── Update student name ────────────────────────────────────────
  updateName: async (studentId: string = "default", name: string) => {
    await db
      .from("student_profiles")
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq("id", studentId)
  },

  // ── Update learning path ───────────────────────────────────────
  updateLearningPath: async (studentId: string = "default", path: string[]) => {
    await db
      .from("student_profiles")
      .update({
        current_learning_path: JSON.stringify(path),
        updated_at: new Date().toISOString()
      })
      .eq("id", studentId)
  },

  // ── Get session count ──────────────────────────────────────────
  getSessionCount: async (studentId: string = "default"): Promise<number> => {
    const { count } = await db
      .from("session_history")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
    return count || 0
  },

  // ── Get last N sessions for context ────────────────────────────
  getRecentSessions: async (
    studentId: string = "default",
    limit: number = 5
  ) => {
    const { data } = await db
      .from("session_history")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit)
    return data || []
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}
