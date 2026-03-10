import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'local-rag.db');

// Initialize DB
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Ensure Table Exists
db.exec(`
  CREATE TABLE IF NOT EXISTS rag_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    embedding TEXT NOT NULL, -- Stored as JSON string
    source TEXT NOT NULL,
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    chapter TEXT NOT NULL,
    page_range TEXT NOT NULL,
    priority INTEGER DEFAULT 1, -- 1=NCERT, 2=GUIDE
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add priority column if it doesn't exist (for existing DBs)
try {
  db.exec('ALTER TABLE rag_chunks ADD COLUMN priority INTEGER DEFAULT 1');
} catch (e) {
  // Column likely exists, ignore
}

export interface RagChunk {
  content: string;
  embedding: number[];
  source: string;
  class: string;
  subject: string;
  chapter: string;
  pageRange: string;
  priority?: number; // Optional, defaults to 1
}

export const ragDb = {
  insertChunk: (chunk: RagChunk) => {
    const stmt = db.prepare(`
      INSERT INTO rag_chunks (content, embedding, source, class, subject, chapter, page_range, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      chunk.content,
      JSON.stringify(chunk.embedding),
      chunk.source,
      chunk.class,
      chunk.subject,
      chunk.chapter,
      chunk.pageRange,
      chunk.priority || 1
    );
  },

  // Helper to check stats
  getStats: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM rag_chunks');
    const result = stmt.get() as { count: number };
    return result.count;
  },

  // Fetch all chunks for in-memory vector search (efficient enough for <100k chunks)
  fetchAllChunks: () => {
    const stmt = db.prepare('SELECT content, embedding, source, priority FROM rag_chunks');
    return stmt.all() as { content: string; embedding: string; source: string; priority: number }[];
  }
};
