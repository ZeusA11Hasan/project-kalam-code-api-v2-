import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { callLLM } from "@/lib/llm"
import { GEMINI_MODELS } from "@/lib/gemini-constants"

// 🚨 Node runtime required
export const runtime = "nodejs"

// 🎯 INTENT DETECTION
function wantsWhiteboard(text: string): boolean {
  if (!text) return false
  return /board|draw|whiteboard|explain visually|show steps|diagram|visualize/i.test(
    text
  )
}

// 🧱 SCHEMAS
const LLMWhiteboardSchema = z.object({
  mode: z.literal("whiteboard"),
  board_latex: z.string(),
  chat_explanation: z.string()
})

const LLMChatSchema = z.object({
  mode: z.literal("chat"),
  message: z.string()
})

const LLMResponseSchema = z.discriminatedUnion("mode", [
  LLMWhiteboardSchema,
  LLMChatSchema
])

// 🤖 SYSTEM PROMPT
const SYSTEM_PROMPT = `
You are a Senior AI Tutor specialized in LaTeX rendering.

━━━━━━━━━━━━━━━━━━━━━━
MODES (CHOOSE ONE)
━━━━━━━━━━━━━━━━━━━━━━

1. CHAT ONLY MODE
   - Use when user asks a general question.
   - Use when NO whiteboard is requested.
   - JSON Output: { "mode": "chat", "message": "..." }

2. WHITEBOARD MODE
   - TRIGGER: user explicitly asks to "use board", "draw", "visualize", "show on whiteboard".
   - JSON Output: 
     {
       "mode": "whiteboard",
       "board_latex": "PURE LATEX CODE HERE (Align/Array/Cases)",
       "chat_explanation": "Short summary of what is shown"
     }

━━━━━━━━━━━━━━━━━━━━━━
LATEX RULES (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━
- Output ONLY valid LaTeX syntax.
- NO Markdown (\`\`\`), NO comments.
- Use 'align*' for multi-step math.
- Use 'array' for matrices/tables.
- Ensure all brackets {} are balanced.
- DO NOT use unsupported packages.

━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE OUTPUTS
━━━━━━━━━━━━━━━━━━━━━━

User: "Hello"
Output:
{
  "mode": "chat",
  "message": "Hello! How can I help you learn today?"
}

User: "Solve x^2 + 5x + 6 = 0 on the board"
Output:
{
  "mode": "whiteboard",
  "board_latex": "\\\\begin{align*} x^2 + 5x + 6 &= 0 \\\\\\\\ (x+2)(x+3) &= 0 \\\\\\\\ x &= -2, -3 \\\\end{align*}",
  "chat_explanation": "I've factored the quadratic equation to find the two solutions for x."
}
`

// 🔁 API HANDLER
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, messages } = body
    const userQuery = message || messages?.[messages.length - 1]?.content || ""

    if (!userQuery) throw new Error("No message provided")

    const isBoardRequest = wantsWhiteboard(userQuery)

    // 🔴 DEMO MODE — REMOVE AFTER LLM IS LIVE
    if (userQuery.includes("Solve x^2 + 5x + 6 = 0 on the board")) {
      const demoLatex = [
        "x^2 + 5x + 6 = 0",
        "\\text{Factor the quadratic:}",
        "(x + 2)(x + 3) = 0",
        "\\text{Set each factor equal to zero:}",
        "x + 2 = 0 \\quad \\text{or} \\quad x + 3 = 0",
        "\\text{Therefore,}",
        "x = -2 \\quad \\text{or} \\quad x = -3"
      ]

      return NextResponse.json({
        mode: "whiteboard",
        chat: "I've factored the quadratic equation step by step on the board.",
        whiteboard: {
          title: "Quadratic Solution",
          sequence: [
            {
              step: 1,
              explain: "Solving the quadratic equation step-by-step.",
              draw: demoLatex.map((line, index) => ({
                type: "latex",
                content: line,
                zone: "CENTER",
                row: index + 1
              }))
            }
          ]
        }
      })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey)
      return NextResponse.json({
        mode: "chat",
        chat: "Configuration Error: No API Key."
      })

    // 🧠 LLM CALL
    const result = await callLLM(userQuery, {
      apiKey,
      systemInstruction: SYSTEM_PROMPT,
      geminiModel: GEMINI_MODELS.FAST,
      stream: false
    })

    let text = result as string
    // Clean potential markdown code blocks
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    // 🔍 PARSE & VALIDATE
    let parsedString
    try {
      parsedString = JSON.parse(text)
    } catch {
      // Fallback to chat if JSON invalid
      return NextResponse.json({ mode: "chat", chat: text })
    }

    // Validate against discriminated union
    const validation = LLMResponseSchema.safeParse(parsedString)

    if (!validation.success) {
      console.error("Schema Validation Failed", validation.error)
      return NextResponse.json({
        mode: "chat",
        chat: "I encountered an error generating the explanation."
      })
    }

    const data = validation.data

    if (data.mode === "chat") {
      return NextResponse.json({
        mode: "chat",
        chat: data.message
      })
    }

    if (data.mode === "whiteboard") {
      // 🔄 TRANSFORM FOR FRONTEND (Mapping to WhiteboardSequence)
      return NextResponse.json({
        mode: "whiteboard",
        chat: data.chat_explanation,
        whiteboard: {
          title: "Visual Explanation",
          sequence: [
            {
              step: 1,
              explain: data.chat_explanation,
              draw: [
                {
                  type: "latex",
                  content: data.board_latex,
                  zone: "CENTER",
                  row: 3
                }
              ]
            }
          ]
        }
      })
    }
  } catch (error) {
    console.error("Backend Error:", error)
    return NextResponse.json({
      mode: "chat",
      chat: "I'm having trouble processing that request right now."
    })
  }
}
