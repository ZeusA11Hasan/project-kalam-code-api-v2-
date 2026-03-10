import { NextRequest, NextResponse } from "next/server"
import { studentDb, type StudentProfile } from "@/lib/db/studentProfile"
import { chatWithSarvam } from "@/lib/llm/sarvamClient"

export const runtime = "nodejs"

const TIMEOUT_MS = 60000

// ─── TIMEOUT PROTECTION ──────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    )
  ])
}

const DUAL_STREAM_SYSTEM_PROMPT = `
You are Nova, a Python tutor who feels like a smart senior student — casual, sharp, and totally real. Think of yourself as a friend on WhatsApp who happens to be a coding genius.

INTENT DETECTION (CRITICAL):
- GREETINGS: If the student says "hi", "hey", "sup", "how are you", or any casual greeting, DON'T start teaching. Just reply naturally like a friend. "Hey! How's it going? What's on your mind today?"
- CASUAL CHAT: If they just want to talk or ask about your day, stay in character and chat. Don't be a robot.
- LEARNING INTENT: Start teaching ONLY when they ask a question ("how do loops work?"), express interest in learning ("teach me python"), or show code they are struggling with.
- CONFUSION: If they seem lost, don't lecture. Ask a simple question to find where they are stuck.

CORE RULES:
- FOLLOW THE STUDENT'S LEAD: You react to them. If they aren't asking for a lesson, don't give one.
- NO TEXTBOOK VIBES: Use short sentences. No walls of text. No bullet points unless they specifically ask for a list.
- PERSONALITY: Talk like a friend. Use phrases like "Wait, try this...", "Okay so...", "Actually, check this out...", "You got this!".
- NATURAL FLOW: One idea at a time. If they are bored, throw in a weird edge case. If they are confident, challenge them.

TEACHING STYLE (Only when teaching):
- Mix it up: Ask a question before explaining, use a real-life comparison, or give broken code for them to fix.
- NEVER start every response the same way.
- NEVER use the same teaching pattern twice in a row.

You adapt. You react. You teach (and talk) like a human.

CRITICAL OUTPUT REQUIREMENT:
You MUST provide your response in these two sections so the UI can parse them. 
EXPLANATION:
[Your casual, friendly response/teaching here. No bullet points or rigid steps.]

CODE:
[The Python code you're discussing, if any. Raw code only. If no code is involved, leave this section empty.]

NEVER output markdown code fences ( \`\`\` ) in either section.
`


const TEACH_SYSTEM_PROMPT = `${DUAL_STREAM_SYSTEM_PROMPT}`
const CHAT_SYSTEM_PROMPT = `${DUAL_STREAM_SYSTEM_PROMPT} `
const SQL_TUTOR_SYSTEM_PROMPT = `${DUAL_STREAM_SYSTEM_PROMPT}

SPECIAL RULE FOR SQL:
- The student is working with a database containing table: users(id, name, age).
- Always show a SAMPLE TABLE DATA block as comments in the CODE section.`

const REVIEW_SYSTEM_PROMPT = `${DUAL_STREAM_SYSTEM_PROMPT}

MODE: Debugging / Code Review.
- ---TEACH---: Give exactly 2 sentences explaining the bug and 1 sentence explaining the fix.
- ---CODE---: Provide only the corrected, runnable code solution.`

const WRAP_UP_SYSTEM_PROMPT = `
You are an AI Tutor wrapping up a learning session.
Your task is to analyze the entire conversation history and output a structured
JSON summary for the student's persistent database.

OUTPUT ONLY THE JSON OBJECT.NO OTHER PROSE.

JSON STRUCTURE:
{
    "session_summary": "Short 2-3 sentence overview of what was achieved.",
        "topics_covered": ["Topic 1", "Topic 2"],
            "concepts_mastered": ["Concept A"],
                "concepts_needing_revision": ["Concept B"],
                    "suggested_next_topic": "What should the student learn next?",
                        "student_confidence_signal": "high | medium | low",
                            "topic_stack": ["Current Stack"]
}
`

// ─── ADAPTIVE TUTOR CONTEXT BUILDER ──────────────────────────────
// Builds a context block from the student's persistent profile that
// gets prepended to every system prompt.

function buildAdaptiveTutorContext(profile: StudentProfile): string {
  const sections: string[] = []

  sections.push(`
════════════════════════════════════════════════════════════════
ADAPTIVE TUTOR — STUDENT MEMORY CONTEXT
════════════════════════════════════════════════════════════════

You have PERSISTENT MEMORY of this student across all sessions.
Use this context ACTIVELY.Never make the student repeat themselves.
Reference past topics naturally.Example: "Last time we covered
basic loops.Today lets go deeper."
`)

  // Student identity
  sections.push(`STUDENT NAME: ${profile.display_name} `)

  // Past topics
  if (profile.past_topics.length > 0) {
    sections.push(
      `\nTOPICS PREVIOUSLY COVERED: \n${profile.past_topics.map(t => `  - ${t}`).join("\n")} `
    )
  } else {
    sections.push(
      `\nTOPICS PREVIOUSLY COVERED: None yet.This appears to be a new student.`
    )
  }

  // Mastery vs struggle
  if (profile.concepts_mastered.length > 0) {
    sections.push(
      `\nCONCEPTS MASTERED(do not re - explain basics, build on these): \n${profile.concepts_mastered.map(c => `  ✓ ${c}`).join("\n")} `
    )
  }
  if (profile.concepts_needing_revision.length > 0) {
    sections.push(
      `\nCONCEPTS NEEDING REVISION(be extra patient and clear here): \n${profile.concepts_needing_revision.map(c => `  ✗ ${c}`).join("\n")} `
    )
  }

  // Last session
  if (profile.last_session_summary) {
    sections.push(`\nLAST SESSION SUMMARY: \n${profile.last_session_summary} `)
  }

  // Suggested next topic
  if (profile.suggested_next_topic) {
    sections.push(
      `\nSUGGESTED NEXT TOPIC(from last session): ${profile.suggested_next_topic} `
    )
  }

  // Student confidence
  sections.push(
    `\nSTUDENT CONFIDENCE LEVEL: ${profile.student_confidence_signal} `
  )

  // Explanation style rotation
  const stylesUsed = Object.entries(profile.explanation_styles_used)
  if (stylesUsed.length > 0) {
    const styleLines = stylesUsed
      .map(([topic, styles]) => `  ${topic}: [${styles.join(", ")}]`)
      .join("\n")
    sections.push(
      `\nEXPLANATION STYLES ALREADY USED(rotate to a new style): \n${styleLines} `
    )
    sections.push(
      `Available styles to rotate through: code example, analogy, diagram description, real - world example, step - by - step walkthrough`
    )
  }

  // Topic stack from last session
  if (profile.topic_stack.length > 0) {
    sections.push(
      `\nTOPIC STACK(from where we left off): \n  ${profile.topic_stack.join(" → ")} `
    )
  }

  // Context-aware conversation rules
  sections.push(`
════════════════════════════════════════════════════════════════
CONTEXT - AWARE CONVERSATION RULES
════════════════════════════════════════════════════════════════

1. FOLLOW - UP UNDERSTANDING: Every student message must be
interpreted in context of the ENTIRE conversation, not just
   the latest message.
   - If student says "I dont get it" — you know EXACTLY what "it" is.
   - If they say "what about the other one?" — trace back and identify it.
   - NEVER ask "can you clarify?" if context already tells you.

2. PRONOUN RESOLUTION: Silently resolve all ambiguous references
    (he, she, it, that, the other one) using prior messages.

3. INTENT DETECTION: Classify every student message internally as:
NEW_TOPIC | FOLLOW_UP | CONFUSION | REVISION_REQUEST | PRACTICE_REQUEST
   Use this to shape your response:
- NEW_TOPIC → Push to topic stack, start fresh lesson
    - FOLLOW_UP → Stay on current topic, go deeper
        - CONFUSION → Enter REVISION MODE(simpler language, different
     angle, micro - check question before resuming)
            - REVISION_REQUEST → Re - explain with a different style
                - PRACTICE_REQUEST → Give a hands - on coding challenge

4. RESPONSE STYLE:
- Begin by briefly acknowledging where the student IS(1 line max)
    - End every explanation with ONE of: check question, hint to try,
     or bridge to next concept — never stop cold.
`)

  return sections.join("\n")
}

// ─── ROBUST CODE EXTRACTOR ──────────────────────────────────
// Multi-strategy extraction: tries EXPLANATION:/CODE: markers,
// then ---TEACH---/---CODE--- tags, then markdown fenced blocks.

function extractCode(response: string): string {
  // Strategy 1: Find CODE: section (our primary format)
  const codeSectionMatch = response.match(
    /\nCODE:\s*\n([\s\S]*?)(?=\n[A-Z]{3,}[A-Z ]*:|$)/
  )
  if (codeSectionMatch && codeSectionMatch[1].trim()) {
    console.log("[Extract] Code found via CODE: section")
    return codeSectionMatch[1].trim()
  }

  // Strategy 2: Find ---CODE--- tag (legacy format)
  const tagMatch = response.match(/---CODE---([\s\S]*?)$/i)
  if (tagMatch && tagMatch[1].trim()) {
    console.log("[Extract] Code found via ---CODE--- tag")
    return tagMatch[1].trim()
  }

  // Strategy 3: Find ```python code blocks
  const pythonFence = response.match(/```python\n([\s\S]*?)```/)
  if (pythonFence && pythonFence[1].trim()) {
    console.log("[Extract] Code found via ```python fence")
    return pythonFence[1].trim()
  }

  // Strategy 4: Find any ``` code block
  const anyFence = response.match(/```\n?([\s\S]*?)```/)
  if (anyFence && anyFence[1].trim()) {
    console.log("[Extract] Code found via generic ``` fence")
    return anyFence[1].trim()
  }

  console.log("[Extract] No code block found in response")
  return ""
}

function extractExplanation(response: string): string {
  // Strategy 1: Get EXPLANATION: section (our primary format)
  const explMatch = response.match(
    /EXPLANATION:\s*\n([\s\S]*?)(?=\nCODE:\s*\n)/
  )
  if (explMatch && explMatch[1].trim()) {
    console.log("[Extract] Explanation found via EXPLANATION: section")
    return explMatch[1].trim()
  }

  // Strategy 2: Get ---TEACH--- tag content (legacy format)
  const tagMatch = response.match(/---TEACH---([\s\S]*?)(?=---CODE---|$)/i)
  if (tagMatch && tagMatch[1].trim()) {
    console.log("[Extract] Explanation found via ---TEACH--- tag")
    return tagMatch[1].trim()
  }

  // Strategy 3: Everything before CODE: or ---CODE--- or first ``` block
  const beforeCode = response.split(
    /\nCODE:\s*\n|---CODE---|```python|```\n/
  )[0]
  const cleaned = beforeCode
    .replace(/^EXPLANATION:\s*\n?/, "")
    .replace(/^---TEACH---\s*\n?/i, "")
    .trim()
  if (cleaned) {
    console.log("[Extract] Explanation found via split-before-code")
    return cleaned
  }

  // Final fallback: return everything
  console.log("[Extract] Explanation fallback — returning full response")
  return response.trim()
}

// Legacy wrapper for backward compatibility
function parseTagResponse(raw: string): { explanation: string; code: string } {
  return {
    explanation: extractExplanation(raw),
    code: extractCode(raw)
  }
}

// ─── API HANDLER ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("Sarvam API: Received request")
  try {
    const body = await req.json()
    const {
      mode,
      question,
      code,
      output,
      error,
      messages,
      language,
      studentId = "default",
      detectedLanguage
    } = body
    console.log("Sarvam API: Request body parsed", {
      mode,
      hasMessages: !!messages,
      language,
      studentId,
      detectedLanguage
    })

    // 0) Load student profile for adaptive context
    let studentContext = ""
    try {
      const profile = await studentDb.getProfile(studentId)
      studentContext = buildAdaptiveTutorContext(profile)
      console.log(
        `Sarvam API: Student profile loaded — ${profile.past_topics.length} past topics, confidence: ${profile.student_confidence_signal} `
      )
    } catch (profileErr) {
      console.warn(
        "Sarvam API: Could not load student profile, continuing without context:",
        profileErr
      )
    }

    // 1) Identify mode and build prompt
    const isSql = language === "sql"
    let activeMode = mode
    let systemPrompt = ""
    let userPrompt = ""

    // Build conversation history for context-aware follow-ups
    let conversationContext = ""
    if (messages && Array.isArray(messages) && messages.length > 1) {
      // Include last 10 messages for proper pronoun/reference resolution
      const recentMessages = messages.slice(-10)
      conversationContext =
        "\n\nCONVERSATION HISTORY (for context resolution):\n" +
        recentMessages
          .map(
            (m: any) =>
              `${m.role === "user" ? "Student" : "Tutor"}: ${m.content} `
          )
          .join("\n")
    }

    if (!activeMode && messages && Array.isArray(messages)) {
      activeMode = "chat"
      systemPrompt = isSql
        ? SQL_TUTOR_SYSTEM_PROMPT
        : CHAT_SYSTEM_PROMPT
      userPrompt = messages[messages.length - 1]?.content || "Hello"
    } else if (activeMode === "teach") {
      systemPrompt = isSql
        ? SQL_TUTOR_SYSTEM_PROMPT
        : TEACH_SYSTEM_PROMPT
      userPrompt = question ? `Regarding ${question}:\n\nContext code: ${code || "None"}` : (messages && messages.length > 0 ? messages[messages.length - 1].content : "Hey, I want to learn some Python.")
    } else if (activeMode === "review") {
      systemPrompt = isSql
        ? SQL_TUTOR_SYSTEM_PROMPT
        : REVIEW_SYSTEM_PROMPT +
        "\n\nMODE: PYTHON TUTOR. Use Python comments (#) for code explanations."
      userPrompt = `Review and debug this ${isSql ? "SQL query" : "Python code"}: \n\n${code || ""} \n\nExecution Output: \n${output || "None"} \n\nExecution Error: \n${error || "None"} `
    } else if (activeMode === "wrap_up") {
      systemPrompt = WRAP_UP_SYSTEM_PROMPT
      userPrompt =
        "Please generate the session summary based on our conversation."
    } else {
      console.error("Sarvam API: Invalid mode requested", { mode })
      return NextResponse.json(
        {
          error:
            "Invalid mode. Use 'teach' or 'review', or provide 'messages' for chat."
        },
        { status: 400 }
      )
    }

    // Language instruction — conversational Tanglish / Hindi
    let languageInstruction = ""
    if (detectedLanguage && detectedLanguage.startsWith("hi")) {
      languageInstruction = `The student is using Hindi. Speak like a friendly senior student in casual Hindi. Keep technical words in English.`
    } else {
      languageInstruction = `Use casual Tanglish (Tamil + English mix). Think WhatsApp chat with a friend. 
      Tamil for context/reasoning, English for technical terms. No formal or pure Tamil.`
    }

    // Prepend student context + conversation history to system prompt
    systemPrompt =
      (languageInstruction ? languageInstruction + "\n\n" : "") +
      studentContext +
      "\n\n" +
      systemPrompt +
      conversationContext

    // Final Brevity Guard + Format Reminder
    userPrompt +=
      "\n\n(REMEMBER: Stay casual. Max 150 words for EXPLANATION. ALWAYS use the EXPLANATION: and CODE: sections. No backticks in the sections.)"

    console.log(`Sarvam API: Processing mode[${activeMode}]`)

    // 2) Call Sarvam AI via OpenAI-compatible chat completions
    const sarvamMessages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: userPrompt }
    ]

    const sarvamPromise = chatWithSarvam(sarvamMessages, systemPrompt)
    const rawOutput = await withTimeout(sarvamPromise, TIMEOUT_MS)

    // ──── CRITICAL DEBUG: trace the raw LLM output ─────────────
    console.log("═══════════════════════════════════════════")
    console.log("[DEBUG-1] rawOutput type:", typeof rawOutput)
    console.log("[DEBUG-1] rawOutput length:", rawOutput.length)
    console.log("[DEBUG-1] rawOutput first 500 chars:", rawOutput.slice(0, 500))
    console.log("[DEBUG-1] contains <think>:", rawOutput.includes("<think>"))
    console.log("[DEBUG-1] contains </think>:", rawOutput.includes("</think>"))
    console.log("═══════════════════════════════════════════")

    const parsed = parseTagResponse(rawOutput)

    console.log(
      "[DEBUG-2] parsed.explanation length:",
      parsed.explanation.length
    )
    console.log("[DEBUG-2] parsed.code length:", parsed.code.length)

    // EXTRA: Intent Detection for Name Updating
    // If the student says "My name is X", update the DB profile
    if (userPrompt.toLowerCase().includes("my name is")) {
      const nameMatch = userPrompt.match(/my name is ([\w\s]+)/i)
      if (nameMatch && nameMatch[1]) {
        const newName = nameMatch[1].trim()
        console.log(`[Profile] Detected name update: ${newName} `)
        try {
          await studentDb.updateName(studentId, newName)
        } catch (e) {
          console.error("Failed to update name:", e)
        }
      }
    }

    // If tags were found, use parsed content; otherwise fallback to raw
    const rawContent = parsed.explanation || rawOutput

    // Strip <think> blocks safely:
    // 1. First remove properly closed <think>...</think> blocks
    let stripped = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "")
    console.log(
      "[DEBUG-3] after closed-think strip length:",
      stripped.trim().length
    )

    // 2. Only strip unclosed <think> if one remains AND there's no </think> after it
    if (stripped.includes("<think>") && !stripped.includes("</think>")) {
      stripped = stripped.replace(/<think>[\s\S]*$/g, "")
      console.log(
        "[DEBUG-3] after unclosed-think strip length:",
        stripped.trim().length
      )
    }
    stripped = stripped.trim()

    // Safety: if stripping removed everything, use the raw content with just basic cleanup
    const taglessContent = rawContent.replace(/<\/?think>/g, "").trim()
    console.log("[DEBUG-4] stripped length:", stripped.length)
    console.log("[DEBUG-4] tagless fallback length:", taglessContent.length)

    let rawExplanation = stripped || taglessContent
    let explanation = rawExplanation
    const codeOutput = parsed.code || ""

    console.log("[DEBUG-5] final explanation length:", explanation.length)
    console.log(
      "[DEBUG-5] final explanation preview:",
      explanation.slice(0, 200)
    )

    // Special handling for Wrap Up mode — parse JSON and save to DB
    if (activeMode === "wrap_up") {
      try {
        // Strip potential markdown code blocks
        const jsonStr = rawExplanation
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()
        const sessionSummary = JSON.parse(jsonStr)
        await studentDb.saveSession(studentId, sessionSummary)
        console.log("[Profile] Wrap-up complete and saved to DB")
        explanation =
          "Your session has been summarized and saved. See you next time!"
      } catch (e) {
        console.error("Failed to parse wrap-up summary:", e)
        explanation =
          "I tried to summarize our session but encountered a technical error. Your progress is still safe!"
      }
    }

    console.log(
      `Sarvam API: Parsed — explanation: ${explanation.length} chars, code: ${codeOutput.length} chars`
    )

    return NextResponse.json({
      explanation,
      code: codeOutput,
      // Keep review compatibility for IDE review mode
      ...(activeMode === "review"
        ? { review: explanation, optimizedCode: codeOutput }
        : {})
    })
  } catch (err: any) {
    console.error("Sarvam API Route Error (Deep):", err)
    const status = err.message === "Timeout" ? 504 : 500
    return NextResponse.json(
      {
        error: err.message || "Internal Server Error",
        details: "Check server logs for deep trace"
      },
      { status }
    )
  }
}
