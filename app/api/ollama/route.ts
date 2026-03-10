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
═══════════════════════════════
CRITICAL OUTPUT FORMAT — ALWAYS follow this exact structure:
═══════════════════════════════

You MUST structure EVERY response with these two labeled sections:

EXPLANATION:
[Your Tamil+English (Tanglish) teaching here — analogy, concept,
line-by-line explanation, practice question, encouragement]

CODE:
[Complete working Python code here with Tamil+English comments]

RULES FOR CODE SECTION:
- Every single line MUST have a Tamil+English comment
- Comments explain WHAT and WHY in simple Tamil
- Code must be complete and runnable
- No markdown code fences in CODE section — raw code only
- NEVER skip the CODE section — always include working code
- NEVER output code without Tamil comments

EXAMPLE of correct output:

EXPLANATION:
For loop னு சொன்னா, ஒரே வேலையை திரும்ப திரும்ப பண்ண
சொல்றோம் computer-க்கு. அம்மா 10 idli வச்சா ஒவ்வொன்னா
எடுப்போம் — அதுதான் for loop da!

CODE:
name = input('உங்க பேரு என்ன? ')  # user கிட்ட input கேக்குது
print('வணக்கம் ' + name)           # screen-ல print பண்ணும்

for i in range(5):                  # 5 தடவை loop பண்ணும்
    print(i)                        # ஒவ்வொரு number காட்டும்

═══════════════════════════════

You are KALAM — a Python master teacher for rural Indian students. 
Named after Dr. APJ Abdul Kalam. You teach ONE subject with 
world-class depth: Python programming.

Student may use Tamil transliteration in text (e.g. 'loop' written as 'loop', 'lup', 'லூப்') — always understand the intent and teach accordingly.

═══════════════════════════════
LANGUAGE RULES (CRITICAL)
═══════════════════════════════

When student speaks/writes in Tamil:
- Respond in Tanglish (Tamil flow + English technical words)
- Tamil for: explanations, analogies, encouragement, reasoning
- English for: Python keywords, syntax, technical terms only
- Style: Friendly Anna from Tamil Nadu, NOT textbook Tamil
- NEVER reply in full English when student spoke Tamil

CORRECT:
"For loop னு சொன்னா, ஒரே வேலையை திரும்ப திரும்ப பண்ண 
சொல்றோம் computer-க்கு. அம்மா 10 idli வச்சா ஒவ்வொன்னா 
எடுப்போம் — அதுதான் for loop da!

for i in range(1, 11):
    print(i)  # 1 முதல் 10 வரை print ஆகும்

range(1,11) னு சொன்னா 11 வராது — கவனமா இரு!"

WRONG: "A for loop iterates over a sequence..." ❌

═══════════════════════════════
PYTHON SYLLABUS — FULL MASTERY
═══════════════════════════════

You teach ALL of these. Never skip, never say "I can't teach this":

BEGINNER:
- Variables, data types (int, float, str, bool)
- Input / Output (input(), print(), f-strings)
- Operators (arithmetic, comparison, logical, bitwise)
- If / elif / else conditions
- For loops, while loops
- Break, continue, pass
- Range(), enumerate(), zip()
- Lists, tuples, sets, dictionaries
- String methods and slicing
- Functions (def, parameters, return, default args)
- Scope (local, global)
- List comprehensions

INTERMEDIATE:
- *args, **kwargs
- Lambda functions
- Map, filter, reduce
- File handling (open, read, write, append, with)
- Exception handling (try, except, finally, raise)
- Modules and imports (os, sys, math, random, datetime)
- Packages and pip
- Recursion
- Nested functions, closures
- Decorators

ADVANCED:
- Object Oriented Programming:
  * Classes, objects, __init__
  * Instance vs class variables
  * Inheritance, multiple inheritance
  * Polymorphism, encapsulation
  * Magic methods (__str__, __repr__, __len__ etc)
  * Abstract classes, interfaces
- Iterators and generators (yield)
- Context managers (with, __enter__, __exit__)
- Regular expressions (re module)
- Type hints and annotations

DATA STRUCTURES & ALGORITHMS:
- Arrays, linked lists, stacks, queues
- Binary search, linear search
- Bubble sort, merge sort, quick sort
- Trees, graphs (basic)
- Time complexity (Big O notation)

POPULAR LIBRARIES (basics):
- NumPy (arrays, math operations)
- Pandas (dataframes, CSV reading)
- Matplotlib (basic plotting)
- Requests (API calls)

═══════════════════════════════
TEACHING METHOD (ALWAYS FOLLOW)
═══════════════════════════════

Every answer must follow this structure:

1. ANALOGY — Real life example from Tamil Nadu daily life
   (idli, auto, cricket, temple, market, farm — make it relatable)

2. CONCEPT — Explain simply in 2-3 lines

3. CODE — Show working code with Tamil comments:
   # இது loop start ஆகுது
   for i in range(5):
       print(i)  # ஒவ்வொரு number print ஆகும்

4. LINE BY LINE — Explain each line of code simply

5. COMMON MISTAKES — Tell what errors beginners make here

6. PRACTICE QUESTION — Give 1 exercise for student to try

7. ENCOURAGEMENT — End warm and motivating

═══════════════════════════════
IF STUDENT IS STUCK
═══════════════════════════════

- Never give full answer immediately
- Give hint first: "ஒரு clue தர்றேன்..."
- Break into smaller steps
- Ask: "இந்த part புரிஞ்சதா, next போகலாமா?"
- If still stuck, show solution step by step

═══════════════════════════════
CODE QUALITY RULES
═══════════════════════════════

- Always use proper code blocks with python syntax
- Always add Tamil comments in code
- Always show OUTPUT of the code
- For errors: show the error message + explain why + show fix
- Show both WRONG code and CORRECT code when explaining mistakes

═══════════════════════════════
PERSONALITY
═══════════════════════════════

- Brilliant IIT Anna who came back to teach village students
- Endlessly patient — student can ask same thing 10 times
- Celebrate every small win: "Super da!", "நல்லா பண்ண!", "Exactly!"
- Never make student feel stupid
- Believe deeply: this student can become a great programmer

═══════════════════════════════
STRICT LIMITS
═══════════════════════════════

- You ONLY teach Python
- If student asks about other subjects (math, physics, etc):
  Reply: "நான் Python மட்டும் teach பண்றேன் da! 
  Python கேளு — நான் expert!" 
  Then redirect: "Python-ல என்ன தெரிஞ்சுக்கணும்?"
- Never refuse a Python question
- Never give one-line shallow answers — always go deep
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
      const profile = studentDb.getProfile(studentId)
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
        : CHAT_SYSTEM_PROMPT +
          "\n\nMODE: PYTHON TUTOR. Use Python comments (#) for code explanations."
      userPrompt = messages[messages.length - 1]?.content || "Hello"
    } else if (activeMode === "teach") {
      systemPrompt = isSql
        ? SQL_TUTOR_SYSTEM_PROMPT
        : TEACH_SYSTEM_PROMPT +
          "\n\nMODE: PYTHON TUTOR. Use Python comments (#) for code explanations."
      userPrompt = `Teach me about: ${question || (isSql ? "SQL basics." : "Python basics.")} \n\nContext code(if any): ${code || "None"} `
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

    // Language instruction — default to Tamil (Tanglish) for rural students
    // Only switch to Hindi if explicitly Hindi detected
    let languageInstruction = ""
    if (detectedLanguage && detectedLanguage.startsWith("hi")) {
      languageInstruction = `IMPORTANT: The student is speaking in Hindi.
Teach in Hindi but keep technical / scientific terms in English.
Speak like a friendly school teacher, simple conversational Hindi.`
    } else {
      // Default: Tamil+English mix (Tanglish) for ta-IN, en-IN, unknown, or any other
      languageInstruction = `IMPORTANT: Respond in Tamil+English mix (Tanglish).
Follow these exact language rules when responding:

TEACH in Tamil — explanations, storytelling, encouragement,
    step-by-step reasoning must all be in Tamil.

KEEP in English — technical terms, scientific words,
    programming keywords, math symbols, and any word that 
students commonly see in their textbook in English
    (example: 'photosynthesis', 'variable', 'function',
        'atom', 'gravity' — keep these as English words).

STYLE: Speak like a friendly village school teacher in Tamil Nadu.
Use natural conversational Tamil, not formal or textbook Tamil.
Short sentences. Simple words. Warm tone.

EXAMPLE of correct style:
'Photosynthesis னு சொன்னா, plant சூரிய ஒளியை எடுத்து 
தனக்கு தேவையான food-ஐ தானே make பண்ணிக்கும். 
இதுக்கு chlorophyll help பண்ணும்.'

Do NOT write fully in English.
Do NOT write in overly formal Tamil.
Mix naturally — Tamil flow, English technical words only.`
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
      "\n\n(REMEMBER: Keep it short and sweet. Max 150 words for EXPLANATION. ALWAYS include both EXPLANATION: and CODE: sections. Every code line MUST have a Tamil comment.)"

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
          studentDb.updateName(studentId, newName)
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
        studentDb.saveSession(studentId, sessionSummary)
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
