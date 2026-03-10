// ─── STUDENT PROFILE — PERSISTENT MEMORY ENGINE ─────────────────
// Uses better-sqlite3 to store and retrieve student learning data
// across sessions. This is the "brain" that makes the tutor adaptive.

import Database from "better-sqlite3"
import path from "path"

const DB_PATH = path.resolve(process.cwd(), "local-rag.db")

// Reuse the existing DB file
const db = new Database(DB_PATH)
db.pragma("journal_mode = WAL")

// ─── SCHEMA ──────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS student_profiles (
    id TEXT PRIMARY KEY DEFAULT 'default',
    display_name TEXT NOT NULL DEFAULT 'Student',
    current_learning_path TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS session_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL DEFAULT 'default',
    session_summary TEXT NOT NULL,
    topics_covered TEXT NOT NULL DEFAULT '[]',
    concepts_mastered TEXT NOT NULL DEFAULT '[]',
    concepts_needing_revision TEXT NOT NULL DEFAULT '[]',
    suggested_next_topic TEXT DEFAULT '',
    student_confidence_signal TEXT DEFAULT 'medium',
    topic_stack TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student_profiles(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS topic_mastery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL DEFAULT 'default',
    topic TEXT NOT NULL,
    mastery_level TEXT NOT NULL DEFAULT 'learning',
    explanation_styles_used TEXT DEFAULT '[]',
    times_revised INTEGER DEFAULT 0,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, topic)
  )
`)

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
  ensureProfile: (studentId: string = "default", name: string = "Student") => {
    const existing = db
      .prepare("SELECT id FROM student_profiles WHERE id = ?")
      .get(studentId)
    if (!existing) {
      db.prepare(
        "INSERT INTO student_profiles (id, display_name) VALUES (?, ?)"
      ).run(studentId, name)
    }
  },

  // ── Get full student profile (aggregated from all tables) ──────
  getProfile: (studentId: string = "default"): StudentProfile => {
    studentDb.ensureProfile(studentId)

    const profile = db
      .prepare("SELECT * FROM student_profiles WHERE id = ?")
      .get(studentId) as any

    // Get the last session
    const lastSession = db
      .prepare(
        "SELECT * FROM session_history WHERE student_id = ? ORDER BY created_at DESC LIMIT 1"
      )
      .get(studentId) as any

    // Get all unique topics from session history
    const allSessions = db
      .prepare(
        "SELECT topics_covered FROM session_history WHERE student_id = ? ORDER BY created_at DESC LIMIT 20"
      )
      .all(studentId) as any[]

    const pastTopics = new Set<string>()
    for (const session of allSessions) {
      try {
        const topics = JSON.parse(session.topics_covered || "[]")
        topics.forEach((t: string) => pastTopics.add(t))
      } catch {}
    }

    // Get mastery data
    const masteryRows = db
      .prepare("SELECT * FROM topic_mastery WHERE student_id = ?")
      .all(studentId) as any[]

    const conceptsMastered: string[] = []
    const conceptsNeedingRevision: string[] = []
    const explanationStylesUsed: Record<string, string[]> = {}

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
        explanationStylesUsed[row.topic] = JSON.parse(
          row.explanation_styles_used || "[]"
        )
      } catch {
        explanationStylesUsed[row.topic] = []
      }
    }

    return {
      id: profile.id,
      display_name: profile.display_name,
      current_learning_path: safeJsonParse(profile.current_learning_path, []),
      past_topics: Array.from(pastTopics),
      concepts_mastered: conceptsMastered,
      concepts_needing_revision: conceptsNeedingRevision,
      last_session_summary: lastSession?.session_summary || null,
      suggested_next_topic: lastSession?.suggested_next_topic || null,
      topic_stack: safeJsonParse(lastSession?.topic_stack, []),
      explanation_styles_used: explanationStylesUsed,
      student_confidence_signal:
        lastSession?.student_confidence_signal || "medium"
    }
  },

  // ── Save end-of-session summary ────────────────────────────────
  saveSession: (studentId: string = "default", summary: SessionSummary) => {
    studentDb.ensureProfile(studentId)

    db.prepare(
      `
      INSERT INTO session_history 
        (student_id, session_summary, topics_covered, concepts_mastered, 
         concepts_needing_revision, suggested_next_topic, student_confidence_signal, topic_stack)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      studentId,
      summary.session_summary,
      JSON.stringify(summary.topics_covered),
      JSON.stringify(summary.concepts_mastered),
      JSON.stringify(summary.concepts_needing_revision),
      summary.suggested_next_topic,
      summary.student_confidence_signal,
      JSON.stringify(summary.topic_stack)
    )

    // Update topic mastery records
    for (const topic of summary.concepts_mastered) {
      db.prepare(
        `
        INSERT INTO topic_mastery (student_id, topic, mastery_level, last_seen_at)
        VALUES (?, ?, 'mastered', CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, topic) DO UPDATE SET
          mastery_level = 'mastered',
          last_seen_at = CURRENT_TIMESTAMP
      `
      ).run(studentId, topic)
    }

    for (const topic of summary.concepts_needing_revision) {
      db.prepare(
        `
        INSERT INTO topic_mastery (student_id, topic, mastery_level, times_revised, last_seen_at)
        VALUES (?, ?, 'struggling', 1, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, topic) DO UPDATE SET
          mastery_level = 'struggling',
          times_revised = times_revised + 1,
          last_seen_at = CURRENT_TIMESTAMP
      `
      ).run(studentId, topic)
    }

    // Update the profile's updated_at
    db.prepare(
      "UPDATE student_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(studentId)
  },

  // ── Record which explanation style was used for a topic ────────
  recordExplanationStyle: (
    studentId: string = "default",
    topic: string,
    style: string
  ) => {
    studentDb.ensureProfile(studentId)

    // Get current styles
    const row = db
      .prepare(
        "SELECT explanation_styles_used FROM topic_mastery WHERE student_id = ? AND topic = ?"
      )
      .get(studentId, topic) as any

    let styles: string[] = []
    if (row) {
      styles = safeJsonParse(row.explanation_styles_used, [])
      if (!styles.includes(style)) {
        styles.push(style)
      }
      db.prepare(
        "UPDATE topic_mastery SET explanation_styles_used = ? WHERE student_id = ? AND topic = ?"
      ).run(JSON.stringify(styles), studentId, topic)
    } else {
      db.prepare(
        `
        INSERT INTO topic_mastery (student_id, topic, mastery_level, explanation_styles_used, last_seen_at)
        VALUES (?, ?, 'learning', ?, CURRENT_TIMESTAMP)
      `
      ).run(studentId, topic, JSON.stringify([style]))
    }
  },

  // ── Update student name ────────────────────────────────────────
  updateName: (studentId: string = "default", name: string) => {
    db.prepare(
      "UPDATE student_profiles SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(name, studentId)
  },

  // ── Update learning path ───────────────────────────────────────
  updateLearningPath: (studentId: string = "default", path: string[]) => {
    db.prepare(
      "UPDATE student_profiles SET current_learning_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(JSON.stringify(path), studentId)
  },

  // ── Get session count ──────────────────────────────────────────
  getSessionCount: (studentId: string = "default"): number => {
    const result = db
      .prepare(
        "SELECT COUNT(*) as count FROM session_history WHERE student_id = ?"
      )
      .get(studentId) as { count: number }
    return result.count
  },

  // ── Get last N sessions for context ────────────────────────────
  getRecentSessions: (studentId: string = "default", limit: number = 5) => {
    return db
      .prepare(
        "SELECT * FROM session_history WHERE student_id = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(studentId, limit) as any[]
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
