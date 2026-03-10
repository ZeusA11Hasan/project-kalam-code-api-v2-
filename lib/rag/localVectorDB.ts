import Database from "better-sqlite3"
import path from "path"

// Initialize DB in the project root or a persistent location
const dbPath = path.resolve(process.cwd(), "rag_vectors.db")
const db = new Database(dbPath)

// Create table once
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS vectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    embedding TEXT NOT NULL
  )
`
).run()

/**
 * Store a chunk + embedding
 */
export function addVector(content: string, embedding: number[]) {
  db.prepare("INSERT INTO vectors (content, embedding) VALUES (?, ?)").run(
    content,
    JSON.stringify(embedding)
  )
}

/**
 * Cosine similarity
 */
function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0))
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0))
  return dot / (magA * magB)
}

/**
 * Search top-k similar chunks
 */
export function searchVectors(
  queryEmbedding: number[],
  k = 3
): { content: string; score: number }[] {
  const rows = db.prepare("SELECT content, embedding FROM vectors").all()

  const scored = rows.map((row: any) => {
    const embedding = JSON.parse(row.embedding)
    return {
      content: row.content,
      score: cosineSimilarity(queryEmbedding, embedding)
    }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, k)
}
