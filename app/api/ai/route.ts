import { NextResponse } from "next/server"
import { GEMINI_MODELS } from "@/lib/gemini-constants"
import { generateContentGemini } from "@/lib/gemini-raw"

// 🚨 MUST be Node runtime
export const runtime = "nodejs"

export async function POST(req: Request) {
  console.log("API KEY EXISTS:", !!process.env.GEMINI_API_KEY)

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      )
    }

    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt missing" }, { status: 400 })
    }

    // Use Raw Fetch to avoid SDK v1beta issues
    const text = await generateContentGemini(
      process.env.GEMINI_API_KEY,
      GEMINI_MODELS.FAST,
      "You are a helpful assistant.", // Minimal system prompt for simple endpoint
      prompt
    )

    return NextResponse.json({
      mode: "chat",
      text
    })
  } catch (err: any) {
    console.error("[AI] Error:", err)
    return NextResponse.json(
      { error: err.message || "AI error" },
      { status: 500 }
    )
  }
}
