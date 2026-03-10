import { NextResponse } from "next/server"
import { embedText } from "@/lib/rag/embed"
import { addVector } from "@/lib/rag/localVectorDB"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { chunks } = await req.json()
    // chunks = string[] (already chunked text)

    if (!chunks || !Array.isArray(chunks)) {
      return NextResponse.json(
        { error: "Invalid chunks format" },
        { status: 400 }
      )
    }

    console.log(`[RAG INGEST] Processing ${chunks.length} chunks...`)

    for (const chunk of chunks) {
      if (typeof chunk === "string" && chunk.trim().length > 0) {
        const embedding = await embedText(chunk)
        addVector(chunk, embedding)
      }
    }

    console.log(`[RAG INGEST] Successfully stored ${chunks.length} vectors.`)

    return NextResponse.json({ status: "stored", count: chunks.length })
  } catch (error: any) {
    console.error("[RAG INGEST] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
