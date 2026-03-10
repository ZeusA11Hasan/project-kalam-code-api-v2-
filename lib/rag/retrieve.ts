import { embedText } from "./embed"
import { ragDb } from "../db/rag"

interface ScoredChunk {
  content: string
  score: number
  priority: number
  source: string
}

// Cosine Similarity Helper
function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0))
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0))
  return dot / (magA * magB)
}

export async function retrieveRagChunks(query: string): Promise<ScoredChunk[]> {
  const queryEmbedding = await embedText(query)
  const allChunks = ragDb.fetchAllChunks()

  // 1. Score all chunks
  const scored: ScoredChunk[] = allChunks.map(chunk => {
    const embedding = JSON.parse(chunk.embedding)
    return {
      content: chunk.content,
      priority: chunk.priority || 1, // Default to NCERT (1)
      source: chunk.source,
      score: cosineSimilarity(queryEmbedding, embedding)
    }
  })

  // 2. Phase 1: NCERT Retrieval
  const ncertChunks = scored
    .filter(c => c.priority === 1 && c.score >= 0.75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  console.log(`[GUIDE FILTER] NCERT chunks found: ${ncertChunks.length}`)

  // 3. Safety Check: If NO NCERT chunks, return empty (Blocking Guide-Only)
  if (ncertChunks.length === 0) {
    console.log(
      `[GUIDE FILTER] No NCERT chunks found. Blocking Guide retrieval.`
    )
    return []
  }

  // 4. Phase 2: Guide Retrieval (Conditional)
  const guideChunks = scored
    .filter(c => c.priority === 2 && c.score >= 0.8) // Stricter threshold for guides
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

  console.log(`[GUIDE FILTER] GUIDE chunks allowed: ${guideChunks.length}`)

  // 5. Merge (NCERT First)
  return [...ncertChunks, ...guideChunks]
}
