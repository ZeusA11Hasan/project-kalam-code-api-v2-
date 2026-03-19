import { NextRequest, NextResponse } from "next/server"
import { studentDb, type StudentProfile } from "@/lib/db/studentProfile"
import { chatWithSarvam } from "@/lib/llm/sarvamClient"
import { chatDb } from "@/lib/db/chatHistory"

export const runtime = "nodejs"

const TIMEOUT_MS = 60000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    )
  ])
}

import { KALAM_SYSTEM_PROMPT_TEMPLATE, KALAM_SYLLABUS } from "@/lib/prompts/kalam-persona"

function buildAdaptiveTutorContext(profile: StudentProfile, languageMode: string): string {
  const currentModuleId = profile.topic_stack?.[0] ? parseInt(profile.topic_stack[0]) : 1
  const currentModule = KALAM_SYLLABUS.modules.find(m => m.id === currentModuleId) || KALAM_SYLLABUS.modules[0]

  const memoryContext = {
    weak_topics: profile.concepts_needing_revision || [],
    strong_topics: profile.concepts_mastered || [],
    confidence_score: profile.student_confidence_signal === "high" ? 0.9 : profile.student_confidence_signal === "low" ? 0.3 : 0.6,
    last_session_summary: profile.last_session_summary || "New student, no summaries yet. Start adapting."
  }

  return KALAM_SYSTEM_PROMPT_TEMPLATE
    .replace("{student_name}", profile.display_name || "Student")
    .replace("{current_module_id}", currentModule.id.toString())
    .replace("{current_module_title}", currentModule.title)
    .replace("{completed_topics}", profile.past_topics?.join(", ") || "None")
    .replace("{xp}", (profile.xp || 0).toString())
    .replace("{level}", (profile.level || 1).toString())
    .replace("{student_memory_context}", JSON.stringify(memoryContext, null, 2))
    .replace("{language_mode}", languageMode)
}

export async function POST(req: NextRequest) {
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
      conversationId = "default_convo",
      error_line
    } = body

    // Default convo ID if not explicitly passed
    const activeConvoId = conversationId !== "default_convo" ? conversationId : studentId;

    // 1) Logic to determine the core query
    let userQuery = question || (messages && messages.length > 0 ? messages[messages.length - 1].content : "Hello")

    // MODE OVERRIDE: If review mode, use the code as the query
    if (mode === "review" && code) {
      userQuery = `Review this Python code.
Student Code:
${code}

${error ? `Runtime Error: ${error}` : ""}
${error_line ? `Error happens on Line: ${error_line}` : ""}

Analyze the code carefully and help the student fix it.`
    }

    // 2) DETECT LANGUAGE (STRICT)
    function detectLanguageMode(text: string) {
      const hasTamilScript = /[\u0B80-\u0BFF]/.test(text);

      const tanglishWords = [
        "enna", "epdi", "inga", "pannu", "iruku", "venum",
        "seri", "appo", "ippo", "athukku", "idhu", "adhu"
      ];

      const hasTanglish = tanglishWords.some(word =>
        text.toLowerCase().includes(word)
      );

      if (hasTamilScript || hasTanglish) {
        return "mixed"; // 🔥 force mixed
      }

      return "english";
    }
    const languageMode = detectLanguageMode(userQuery);
    console.log("Language Mode:", languageMode);
    console.log("User Input:", userQuery);

    // 3) Load student profile
    let systemPrompt = ""
    try {
      const profile = await studentDb.getProfile(studentId)
      systemPrompt = buildAdaptiveTutorContext(profile, languageMode)
    } catch (e) {
      systemPrompt = KALAM_SYSTEM_PROMPT_TEMPLATE.replace("{language_mode}", languageMode)
    }

    // Switch to Teach mode if keywords detected
    const keywords = ["python", "loop", "function", "variable", "list", "array", "லூப்", "மாறி", "செயலி", "குறியீடு"]
    const isTechnical = keywords.some(k => userQuery.toLowerCase().includes(k))

    let finalSystemPrompt = systemPrompt
    if (isTechnical || mode === "teach") {
      finalSystemPrompt += "\n\nCRITICAL: NO Hindi. NO structured sections. Even if the student says one word, provide a full concept explanation (at least 20-30 words)."
    }

    if (mode === "review") {
      finalSystemPrompt = `You are an AI Code Tutor in REVIEW MODE.

----------------------------------
LANGUAGE MODE: ${languageMode}
----------------------------------
IF LANGUAGE MODE IS "english":
- Respond ONLY in simple English.
- DO NOT use any Tamil words.

IF LANGUAGE MODE IS "mixed":
- Respond in naturally mixed Tamil + English (Tanglish) IN THE SAME SENTENCE.
- DO NOT separate the explanation into "Tamil" and "English" sections.
- Mix them fluently like how a bilingual developer speaks.
- Example: "print statement-la syntax error irukku. Python 3-la print() oru function, so parentheses use pannanum."

----------------------------------
CODE FEEDBACK RULES
----------------------------------
1. Identify the mistake clearly
2. Mention exact line of error
3. Explain WHY it's wrong
4. Show corrected code in the 'code_example' JSON field
5. Keep explanation simple (student-friendly)

----------------------------------
INLINE CODE COMMENTING (VERY IMPORTANT)
----------------------------------
When showing code:
- Add inline comments using #
- Mark mistakes like:
❌ for error
✅ for correct

Example:
for i in range(5)   # ❌ Missing colon (:)
    print(i)        # ✅ Corrected indentation

----------------------------------
TONE
----------------------------------
- Friendly like a friend
- Clear like a teacher
- Motivating

Example:
"Good attempt! Small mistake only — let's fix it together."

----------------------------------
ENDING (IMPORTANT UX)
----------------------------------
Always end your explanation with:
👉 "Check the highlighted code on the right IDE 👨‍💻"

----------------------------------
JSON RESPONSE STRUCTURE
----------------------------------
You MUST return a valid JSON object containing:
- "reply": "Your explanation following the Language Mode rules, and ending with the required IDE message."
- "code_example": "The corrected code with inline comments (# ❌ and # ✅)"
- "highlight_lines": [array of line numbers with errors]
- "tts_text": "Spoken-friendly text of the explanation"
`;
    } else {
      finalSystemPrompt += `\n\nLanguage Mode: ${languageMode}\nYOU MUST FOLLOW THIS STRICTLY.`;
    }

    const promptWithRules = `${finalSystemPrompt}\n\nREMEMBER: RETURN ONLY VALID JSON. No markdown backticks.`

    // 2) STEP 3 & 4: Fetch Old Chat (CONTEXT MAGIC)
    const dbHistory = await chatDb.getConversationHistory(studentId, activeConvoId, 20)

    // Save current user message
    await chatDb.saveMessage({
      user_id: studentId,
      conversation_id: activeConvoId,
      role: "user",
      content: userQuery,
    }).catch(console.error)

    // Prepare multi-turn history from DB memory
    let rawSarvamMessages = dbHistory.length > 0
      ? [...dbHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })), { role: "user" as const, content: userQuery }]
      : [{ role: "user" as const, content: userQuery }]

    // ─── STRICT VALIDATION: Sarvam requires alternating turns starting with "user" ───
    let sarvamMessages: { role: "user" | "assistant"; content: string }[] = []

    for (const msg of rawSarvamMessages) {
      if (sarvamMessages.length === 0) {
        if (msg.role === "user") sarvamMessages.push(msg)
      } else {
        const lastRole = sarvamMessages[sarvamMessages.length - 1].role
        if (msg.role !== lastRole) {
          sarvamMessages.push(msg)
        } else {
          // Replace last message with current one to keep it fresh if same role
          sarvamMessages[sarvamMessages.length - 1] = msg
        }
      }
    }

    // Final guard: Ensure it ends with a user message for Sarvam completion
    if (sarvamMessages.length > 0 && sarvamMessages[sarvamMessages.length - 1].role === "assistant") {
      sarvamMessages.pop()
    }

    if (sarvamMessages.length === 0) {
      sarvamMessages = [{ role: "user" as const, content: userQuery }]
    }

    // ENSURE OVERRIDDEN QUERY IS USED: Replace last user content if review mode
    if (mode === "review" && sarvamMessages.length > 0) {
      sarvamMessages[sarvamMessages.length - 1].content = userQuery
    }



    console.log("════════════ KALAM PROMPT ════════════")
    console.log(userQuery)

    const rawOutput = await withTimeout(chatWithSarvam(sarvamMessages, promptWithRules), TIMEOUT_MS)

    console.log("════════════ SARVAM RESPONSE ════════════")
    console.log(rawOutput)

    let jsonStr = rawOutput;
    const start = rawOutput.indexOf("{");
    const end = rawOutput.lastIndexOf("}") + 1;
    if (start !== -1 && end > start) {
      jsonStr = rawOutput.substring(start, end);
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e1) {
      console.warn("[KALAM] Initial JSON parse failed. Attempting to fix unescaped newlines...");
      try {
        // Fix unescaped newlines in JSON strings (common LLM bug)
        const fixedJsonStr = jsonStr.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
          return match.replace(/\n/g, "\\n").replace(/\r/g, "");
        });
        parsed = JSON.parse(fixedJsonStr);
      } catch (e2) {
        console.error("[KALAM] JSON parse fully failed:", rawOutput);

        // Regex fallback extraction to salvage the response!
        const replyMatch = jsonStr.match(/"reply"\s*:\s*"([\s\S]*?)"\s*(?:,|}|\s*"code_example")/);
        const autoReply = replyMatch ? replyMatch[1].replace(/\\n/g, " ").replace(/\\"/g, '"') : rawOutput.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>/gi, "").replace(/[{}]/g, "").trim();

        const codeMatch = jsonStr.match(/"code_example"\s*:\s*"([\s\S]*?)"\s*(?:,|}|\s*"topic_detected")/);
        const autoCode = codeMatch ? codeMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : null;

        const followupMatch = jsonStr.match(/"followup_question"\s*:\s*"([\s\S]*?)"\s*(?:,|}|\s*"should_level_up")/);
        const autoFollowup = followupMatch ? followupMatch[1].replace(/\\n/g, " ").replace(/\\"/g, '"') : "";

        const ttsMatch = jsonStr.match(/"tts_text"\s*:\s*"([\s\S]*?)"/);
        const autoTts = ttsMatch ? ttsMatch[1].replace(/\\n/g, " ").replace(/\\"/g, '"') : "";

        parsed = {
          reply: autoReply,
          tts_text: autoTts,
          code_example: autoCode,
          code_with_comments: autoCode,
          clean_code: autoCode,
          topic_detected: null,
          mastery_signal: null,
          xp_to_award: 10,
          followup_question: autoFollowup,
          should_level_up: false,
          highlight_lines: []
        };
      }
    }

    // 2) Post-parse Recursive Check: If the model put JSON inside "reply"
    if (typeof parsed.reply === "string" && (parsed.reply.includes('{"reply":') || parsed.reply.trim().startsWith('{'))) {
      try {
        const start = parsed.reply.indexOf("{")
        const end = parsed.reply.lastIndexOf("}") + 1
        if (start !== -1 && end > start) {
          const subParsed = JSON.parse(parsed.reply.substring(start, end))
          parsed = { ...parsed, ...subParsed }
        }
      } catch { /* ignore if fails */ }
    }

    // 3) Hindi Detection & Retry Validator
    const hindiWordsRegex = /\b(haan|nahi|kya|acha|matlab|samjhe|hai|toh|bhi|aur|karo|dekho|yaar|bilkul)\b/gi;
    const detectedHindiWords = (parsed.reply || "").match(hindiWordsRegex) || [];

    if (detectedHindiWords.length > 2) {
      console.log(`[Tutor] ⚠️ Hindi detected (${detectedHindiWords.length} words). Retrying...`);
      const retryPrompt = `${promptWithRules}\n\nSTRICT: Previous response had Hindi. Follow the language format rules strictly. ZERO Hindi tolerance.`;

      try {
        const retryOutput = await withTimeout(chatWithSarvam(sarvamMessages, retryPrompt), TIMEOUT_MS);
        let retryCleaned = retryOutput
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        const start = retryCleaned.indexOf("{");
        const end = retryCleaned.lastIndexOf("}") + 1;
        if (start !== -1 && end > start) {
          const retryParsed = JSON.parse(retryCleaned.substring(start, end));
          parsed = { ...parsed, ...retryParsed };
        } else {
          parsed.reply = retryCleaned;
        }
        console.log("[Tutor] ✅ Retry successful.");
      } catch (retryErr) {
        console.error("[Tutor] Retry failed:", retryErr);
      }
    }

    // 4) Final cleaning of all strings
    const cleanStr = (s: any) => typeof s === "string" ? s.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>/gi, "").trim() : s

    // Map all possible content keys to 'reply'
    parsed.reply = cleanStr(parsed.reply || parsed.explanation || parsed.review || "")
    parsed.code_example = cleanStr(parsed.code_example || parsed.code || null)
    parsed.followup_question = cleanStr(parsed.followup_question || "")
    parsed.tts_text = cleanStr(parsed.tts_text || "")

    // Ensure reply is never empty
    if (!parsed.reply || parsed.reply.trim().length === 0) {
      console.log("[Tutor] ⚠️ Reply empty. Using fallback.");
      parsed.reply = "Semma nanba! Enna help venum solluda? Python pathi ethavathu doubt irukka?"
    }

    const finalResponse = {
      ...parsed,
      explanation: parsed.reply,
      code: parsed.code_example || ""
    }

    // 5) Save Assistant Reply asynchronously
    chatDb.saveMessage({
      user_id: studentId,
      conversation_id: activeConvoId,
      role: "assistant",
      content: JSON.stringify(parsed),
    }).catch(console.error)

    return NextResponse.json(finalResponse)

  } catch (err: any) {
    console.error("Critical Error", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
