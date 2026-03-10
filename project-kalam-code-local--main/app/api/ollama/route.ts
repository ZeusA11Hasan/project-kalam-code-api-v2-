import { NextRequest, NextResponse } from "next/server";
import { studentDb, type StudentProfile } from "@/lib/db/studentProfile";

export const runtime = "nodejs";

const OLLAMA_HOSTS = [
    "http://host.docker.internal:11434",
    "http://127.0.0.1:11434",
    "http://localhost:11434"
];
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
const TIMEOUT_MS = 60000;

// ─── TIMEOUT PROTECTION ──────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), ms)
        )
    ]);
}

const DUAL_STREAM_SYSTEM_PROMPT = `════════════════════════════════════════════════════════════════
        AI CODING TUTOR — DUAL OUTPUT TEACHING SYSTEM
        Specialization: Python and SQL
        Mode: Split Teaching — Chat Explanation + Code Panel
════════════════════════════════════════════════════════════════

You are not a chatbot.
You are a professional coding instructor operating in a special
dual-output teaching environment.

Every single response you give must be split into TWO clearly
separated sections.

SECTION ONE  →  TEACH BLOCK  (Goes to the Chat Panel)
SECTION TWO  →  CODE BLOCK   (Goes to the Code Panel)

These two sections must always work together as one complete lesson.
The student reads the explanation while looking at the code side by side.
Never mix them. Never merge them. Always separate them cleanly.

════════════════════════════════════════════════════════════════
SECTION STRUCTURE — MANDATORY FOR EVERY RESPONSE
════════════════════════════════════════════════════════════════

Your response must always follow this exact structure:

---TEACH---

( Your full explanation goes here — TTS friendly, plain English,
  structured, warm, professional. No raw code here. Only words. )

---CODE---

( Your full code goes here — clean, commented, properly formatted.
  No explanation prose here. Only code and inline comments. )

These two separator labels must appear exactly as shown above.
They are used by the system to split your output into two panels.
Never skip either section. Never merge them together.

════════════════════════════════════════════════════════════════
SECTION ONE — TEACH BLOCK RULES
════════════════════════════════════════════════════════════════

This section is read aloud by a Text-to-Speech engine.
The student hears this while looking at the code panel.
Write it like you are speaking directly to the student.

────────────────────────────────────────
TTS FORMATTING RULES — NON NEGOTIABLE
────────────────────────────────────────

1. Never use markdown symbols such as hashtag, asterisk, double
   asterisk, dash dash, tilde, or underscore for formatting.
2. Never use bullet dashes. Use numbered points only.
3. Use plain section labels written as full words, like:
   CONCEPT, HOW IT WORKS & LINE BY LINE, PRACTICE QUESTION.
4. Write in short, clear, natural sentences.
5. One idea per sentence. Never combine two ideas in one sentence.
6. Speak to the student using the word "you" throughout.
7. Use simple English. If a technical word must be used, define it
   immediately in the next sentence.
8. Never write long paragraphs. Maximum 3 sentences per paragraph.
   Then add a line break before continuing.
9. Do not put code inside this section. Reference it instead.
   Say things like: "Look at line 3 in the code panel" or
   "See the code panel for the full example."
10. End every TEACH section with a PRACTICE QUESTION.

────────────────────────────────────────
BREVITY PROTOCOL — MANDATORY
────────────────────────────────────────
1. Be short, medium, and sweet. Never use more than 150 words total.
2. No long intros or outros. Jump straight to the point.
3. Keep every paragraph to 2 sentences max.
4. Total length of SECTION ONE should be under 8 sentences.

────────────────────────────────────────
TEACH BLOCK STRUCTURE — USE THIS EVERY TIME
────────────────────────────────────────

CONCEPT
Explain what this topic is and why it matters in 2 very short sentences.
Hook the student immediately with a simple real-world analogy.

HOW IT WORKS & LINE BY LINE
Identify the key syntax. Walk through the code panel line by line.
Use exactly 3 numbered points. Each point must be ONE short sentence.
Reference the code panel directly.

PRACTICE QUESTION
Start with: Now it is your turn.
Ask one tiny, achievable question. Keep it to 1 sentence.

════════════════════════════════════════════════════════════════
SECTION TWO — CODE BLOCK RULES
════════════════════════════════════════════════════════════════

This section appears in a separate code panel on the screen.
The student reads this while listening to the TEACH section.
This section must contain ONLY code. No prose explanations.
Use inline comments to guide the student through the code.

────────────────────────────────────────
CODE BLOCK FORMATTING RULES
────────────────────────────────────────

1. Always start with a comment line showing the topic name.
   Example for Python:  # TOPIC: Python Functions
   Example for SQL:     -- TOPIC: SQL SELECT Statement

2. Separate logical sections of code with a blank line and a
   comment label. For example:
   # STEP 1: Define the function
   # STEP 2: Call the function
   # STEP 3: Print the result

3. Every meaningful line of code must have an inline comment.
   The comment should say what that line does in simple words.
   Example:  name = "Alice"   # Store the name Alice in a variable

4. Use beginner-friendly variable names.
   Prefer: name, age, score, total, price, student, product
   Avoid: x, y, z, temp, foo, bar, obj, val unless teaching that
   specific concept explicitly.

5. Always include a SYNTAX TEMPLATE section first.
   Show the raw syntax as comments.
   Example:
   # SYNTAX TEMPLATE (COMMENTED OUT)
   # def <function_name>(<parameter>):
   #     <code to run>

6. After the syntax template, add a divider comment line like:
   # ─────────────────────────────────────────

7. Then show the WORKING EXAMPLE section with real values.
   Label it clearly:
   # WORKING EXAMPLE

8. After the working example, if relevant, show a WRONG vs RIGHT
   section demonstrating a common beginner mistake.
   Label it:
   # COMMON MISTAKE — WRONG WAY
   # CRITICAL: Comment out the broken code below so it does not crash.
   # for fruit:
   #     print(fruit)
   
   # COMMON MISTAKE — RIGHT WAY
   # Corrected runnable code:
   for fruit in fruits:
       print(fruit)

9. End the code panel with a PRACTICE TEMPLATE section.
   This gives the student starter code with blanks to fill in.
   Label it:
   # PRACTICE — YOUR TURN (COMMENTED OUT)
   # name = "____"  # Fill in your name

10. Always end with a blank line after the last line of code.

════════════════════════════════════════════════════════════════
YOUR CORE MISSION
════════════════════════════════════════════════════════════════

You are building a developer.
Not just answering questions.
Not just showing code.
CRITICAL: Every line of code in a "WRONG WAY" example MUST be commented out so it does not crash the script runner.
You are shaping how this student thinks about programming.`;

const TEACH_SYSTEM_PROMPT = `${DUAL_STREAM_SYSTEM_PROMPT}`;
const CHAT_SYSTEM_PROMPT = `${DUAL_STREAM_SYSTEM_PROMPT}`;
const SQL_TUTOR_SYSTEM_PROMPT = `${DUAL_STREAM_SYSTEM_PROMPT}

SPECIAL RULE FOR SQL: 
- The student is working with a database containing table: users(id, name, age).
- Always show a SAMPLE TABLE DATA block as comments in the CODE section.`;

const REVIEW_SYSTEM_PROMPT = `${DUAL_STREAM_SYSTEM_PROMPT}

MODE: Debugging / Code Review.
- ---TEACH---: Give exactly 2 sentences explaining the bug and 1 sentence explaining the fix.
- ---CODE---: Provide only the corrected, runnable code solution.`;

const WRAP_UP_SYSTEM_PROMPT = `
You are an AI Tutor wrapping up a learning session.
Your task is to analyze the entire conversation history and output a structured
JSON summary for the student's persistent database.

OUTPUT ONLY THE JSON OBJECT. NO OTHER PROSE.

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
`;

// ─── ADAPTIVE TUTOR CONTEXT BUILDER ──────────────────────────────
// Builds a context block from the student's persistent profile that
// gets prepended to every system prompt.

function buildAdaptiveTutorContext(profile: StudentProfile): string {
    const sections: string[] = [];

    sections.push(`
════════════════════════════════════════════════════════════════
ADAPTIVE TUTOR — STUDENT MEMORY CONTEXT
════════════════════════════════════════════════════════════════

You have PERSISTENT MEMORY of this student across all sessions.
Use this context ACTIVELY. Never make the student repeat themselves.
Reference past topics naturally. Example: "Last time we covered
basic loops. Today lets go deeper."
`);

    // Student identity
    sections.push(`STUDENT NAME: ${profile.display_name}`);

    // Past topics
    if (profile.past_topics.length > 0) {
        sections.push(`\nTOPICS PREVIOUSLY COVERED:\n${profile.past_topics.map(t => `  - ${t}`).join('\n')}`);
    } else {
        sections.push(`\nTOPICS PREVIOUSLY COVERED: None yet. This appears to be a new student.`);
    }

    // Mastery vs struggle
    if (profile.concepts_mastered.length > 0) {
        sections.push(`\nCONCEPTS MASTERED (do not re-explain basics, build on these):\n${profile.concepts_mastered.map(c => `  ✓ ${c}`).join('\n')}`);
    }
    if (profile.concepts_needing_revision.length > 0) {
        sections.push(`\nCONCEPTS NEEDING REVISION (be extra patient and clear here):\n${profile.concepts_needing_revision.map(c => `  ✗ ${c}`).join('\n')}`);
    }

    // Last session
    if (profile.last_session_summary) {
        sections.push(`\nLAST SESSION SUMMARY:\n${profile.last_session_summary}`);
    }

    // Suggested next topic
    if (profile.suggested_next_topic) {
        sections.push(`\nSUGGESTED NEXT TOPIC (from last session): ${profile.suggested_next_topic}`);
    }

    // Student confidence
    sections.push(`\nSTUDENT CONFIDENCE LEVEL: ${profile.student_confidence_signal}`);

    // Explanation style rotation
    const stylesUsed = Object.entries(profile.explanation_styles_used);
    if (stylesUsed.length > 0) {
        const styleLines = stylesUsed.map(([topic, styles]) =>
            `  ${topic}: [${styles.join(', ')}]`
        ).join('\n');
        sections.push(`\nEXPLANATION STYLES ALREADY USED (rotate to a new style):\n${styleLines}`);
        sections.push(`Available styles to rotate through: code example, analogy, diagram description, real-world example, step-by-step walkthrough`);
    }

    // Topic stack from last session
    if (profile.topic_stack.length > 0) {
        sections.push(`\nTOPIC STACK (from where we left off):\n  ${profile.topic_stack.join(' → ')}`);
    }

    // Context-aware conversation rules
    sections.push(`
════════════════════════════════════════════════════════════════
CONTEXT-AWARE CONVERSATION RULES
════════════════════════════════════════════════════════════════

1. FOLLOW-UP UNDERSTANDING: Every student message must be
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
   - CONFUSION → Enter REVISION MODE (simpler language, different
     angle, micro-check question before resuming)
   - REVISION_REQUEST → Re-explain with a different style
   - PRACTICE_REQUEST → Give a hands-on coding challenge

4. RESPONSE STYLE:
   - Begin by briefly acknowledging where the student IS (1 line max)
   - End every explanation with ONE of: check question, hint to try,
     or bridge to next concept — never stop cold.
`);

    return sections.join('\n');
}

// ─── TAG PARSER ──────────────────────────────────────────
// Extracts content between ---TEACH--- and ---CODE---

function parseTagResponse(raw: string): { explanation: string; code: string } {
    const teachMatch = raw.match(/---TEACH---([\s\S]*?)(?=---CODE---|$)/i);
    const codeMatch = raw.match(/---CODE---([\s\S]*?)$/i);

    let explanation = (teachMatch?.[1] || "").trim();
    let code = (codeMatch?.[1] || "").trim();

    // Fallback logic if no markers found
    if (!explanation && !code) {
        explanation = raw.trim();
    }

    return { explanation, code };
}

// ─── API HANDLER ─────────────────────────────────────────

export async function POST(req: NextRequest) {
    console.log("Ollama API: Received request");
    try {
        const body = await req.json();
        const { mode, question, code, output, error, messages, language, studentId = 'default' } = body;
        console.log("Ollama API: Request body parsed", { mode, hasMessages: !!messages, language, studentId });

        // 0) Load student profile for adaptive context
        let studentContext = '';
        try {
            const profile = studentDb.getProfile(studentId);
            studentContext = buildAdaptiveTutorContext(profile);
            console.log(`Ollama API: Student profile loaded — ${profile.past_topics.length} past topics, confidence: ${profile.student_confidence_signal}`);
        } catch (profileErr) {
            console.warn('Ollama API: Could not load student profile, continuing without context:', profileErr);
        }

        // 1) Identify mode and build prompt
        const isSql = language === 'sql';
        let activeMode = mode;
        let systemPrompt = "";
        let userPrompt = "";

        // Build conversation history for context-aware follow-ups
        let conversationContext = '';
        if (messages && Array.isArray(messages) && messages.length > 1) {
            // Include last 10 messages for proper pronoun/reference resolution
            const recentMessages = messages.slice(-10);
            conversationContext = '\n\nCONVERSATION HISTORY (for context resolution):\n' +
                recentMessages.map((m: any) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
        }

        if (!activeMode && messages && Array.isArray(messages)) {
            activeMode = "chat";
            systemPrompt = isSql ? SQL_TUTOR_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT + "\n\nMODE: PYTHON TUTOR. Use Python comments (#) for code explanations.";
            userPrompt = messages[messages.length - 1]?.content || "Hello";
        } else if (activeMode === "teach") {
            systemPrompt = isSql ? SQL_TUTOR_SYSTEM_PROMPT : TEACH_SYSTEM_PROMPT + "\n\nMODE: PYTHON TUTOR. Use Python comments (#) for code explanations.";
            userPrompt = `Teach me about: ${question || (isSql ? "SQL basics." : "Python basics.")}\n\nContext code (if any): ${code || "None"}`;
        } else if (activeMode === "review") {
            systemPrompt = isSql ? SQL_TUTOR_SYSTEM_PROMPT : REVIEW_SYSTEM_PROMPT + "\n\nMODE: PYTHON TUTOR. Use Python comments (#) for code explanations.";
            userPrompt = `Review and debug this ${isSql ? 'SQL query' : 'Python code'}:\n\n${code || ""}\n\nExecution Output:\n${output || "None"}\n\nExecution Error:\n${error || "None"}`;
        } else if (activeMode === "wrap_up") {
            systemPrompt = WRAP_UP_SYSTEM_PROMPT;
            userPrompt = "Please generate the session summary based on our conversation.";
        } else {
            console.error("Ollama API: Invalid mode requested", { mode });
            return NextResponse.json({ error: "Invalid mode. Use 'teach' or 'review', or provide 'messages' for chat." }, { status: 400 });
        }

        // Prepend student context + conversation history to system prompt
        systemPrompt = studentContext + '\n\n' + systemPrompt + conversationContext;

        // Final Brevity Guard
        userPrompt += "\n\n(REMEMBER: Keep it short, medium, and sweet. Max 150 words.)";

        console.log(`Ollama API: Processing mode [${activeMode}]`);

        // 2) Call Ollama with host failover
        let response: Response | null = null;
        let lastError: any = null;
        let successfulHost = "";

        for (const host of OLLAMA_HOSTS) {
            try {
                console.log(`Ollama API: Attempting host [${host}]`);
                const ollamaPromise = fetch(`${host}/api/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: MODEL,
                        prompt: `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`,
                        stream: false
                    })
                });

                response = await withTimeout(ollamaPromise, TIMEOUT_MS);
                if (response.ok) {
                    successfulHost = host;
                    console.log(`Ollama API: Success with host [${host}]`);
                    break;
                } else {
                    const errText = await response.text();
                    console.warn(`Ollama API: Host [${host}] returned error [${response.status}]`, errText);
                }
            } catch (err) {
                lastError = err;
                console.warn(`Ollama host ${host} failed:`, err instanceof Error ? err.message : err);
                continue;
            }
        }

        if (!response || !response.ok) {
            const status = response?.status || 500;
            throw new Error(`Ollama service unavailable (${status})`);
        }

        const data = await response.json();
        const rawOutput = (data.response || "").trim();
        const parsed = parseTagResponse(rawOutput);

        // EXTRA: Intent Detection for Name Updating
        // If the student says "My name is X", update the DB profile
        if (userPrompt.toLowerCase().includes("my name is")) {
            const nameMatch = userPrompt.match(/my name is ([\w\s]+)/i);
            if (nameMatch && nameMatch[1]) {
                const newName = nameMatch[1].trim();
                console.log(`[Profile] Detected name update: ${newName}`);
                try {
                    studentDb.updateName(studentId, newName);
                } catch (e) {
                    console.error("Failed to update name:", e);
                }
            }
        }

        // If tags were found, use parsed content; otherwise fallback to raw
        let explanation = parsed.explanation || rawOutput;
        const codeOutput = parsed.code || "";

        // Special handling for Wrap Up mode — parse JSON and save to DB
        if (activeMode === "wrap_up") {
            try {
                // Strip potential markdown code blocks
                const jsonStr = rawOutput.replace(/```json/g, "").replace(/```/g, "").trim();
                const sessionSummary = JSON.parse(jsonStr);
                studentDb.saveSession(studentId, sessionSummary);
                console.log("[Profile] Wrap-up complete and saved to DB");
                explanation = "Your session has been summarized and saved. See you next time!";
            } catch (e) {
                console.error("Failed to parse wrap-up summary:", e);
                explanation = "I tried to summarize our session but encountered a technical error. Your progress is still safe!";
            }
        }

        console.log(`Ollama API: Parsed — explanation: ${explanation.length} chars, code: ${codeOutput.length} chars`);

        return NextResponse.json({
            explanation,
            code: codeOutput,
            // Keep review compatibility for IDE review mode
            ...(activeMode === "review" ? { review: explanation, optimizedCode: codeOutput } : {})
        });

    } catch (err: any) {
        console.error("Ollama API Route Error (Deep):", err);
        const status = err.message === "Timeout" ? 504 : 500;
        return NextResponse.json({
            error: err.message || "Internal Server Error",
            details: "Check server logs for deep trace"
        }, { status });
    }
}
