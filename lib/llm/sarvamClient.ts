/**
 * Sarvam AI LLM Client
 * Replaces Ollama as the LLM backend.
 * Uses Sarvam's OpenAI-compatible chat completions API.
 */

const SARVAM_API_URL = "https://api.sarvam.ai/v1/chat/completions"
const SARVAM_MODEL = "sarvam-m"

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

/**
 * Non-streaming call to Sarvam AI's chat completions endpoint.
 * @param messages - Array of chat messages (system, user, assistant)
 * @param systemPrompt - System prompt to prepend to the messages
 * @returns The assistant's response content as a string
 */
export async function chatWithSarvam(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY

  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("SARVAM_API_KEY is not configured. Set it in .env.local")
  }

  // Build the full messages array with system prompt first
  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages
  ]

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🔧 SARVAM AI CLIENT LOG")
  console.log(`- Endpoint: ${SARVAM_API_URL}`)
  console.log(`- Model: ${SARVAM_MODEL}`)
  console.log(`- Messages: ${fullMessages.length} (including system)`)

  try {
    const res = await fetch(SARVAM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey
      },
      body: JSON.stringify({
        model: SARVAM_MODEL,
        messages: fullMessages,
        stream: false
      })
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error(`❌ [SARVAM] API Error: ${res.status} ${res.statusText}`)
      console.error(`❌ [SARVAM] Response Body: ${errorBody}`)
      throw new Error(`Sarvam API error ${res.status}: ${errorBody}`)
    }

    const json = await res.json()

    // OpenAI-compatible response format
    const content = json.choices?.[0]?.message?.content || ""

    console.log(`- Response Length: ${content.length} chars`)
    console.log("✅ Success")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return content
  } catch (error: any) {
    console.error("❌ [SARVAM] Exception:", error.message)
    throw error
  }
}

/**
 * Streaming call to Sarvam AI's chat completions endpoint.
 * Returns a ReadableStream of text chunks for SSE-style responses.
 * @param messages - Array of chat messages (system, user, assistant)
 * @param systemPrompt - System prompt to prepend to the messages
 * @returns ReadableStream<Uint8Array> for streaming to the client
 */
export async function chatWithSarvamStream(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.SARVAM_API_KEY

  if (!apiKey || apiKey === "your_key_here") {
    throw new Error("SARVAM_API_KEY is not configured. Set it in .env.local")
  }

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages
  ]

  console.log(`[SARVAM STREAM] Starting stream for model: ${SARVAM_MODEL}`)

  try {
    const res = await fetch(SARVAM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey
      },
      body: JSON.stringify({
        model: SARVAM_MODEL,
        messages: fullMessages,
        stream: true
      })
    })

    if (!res.ok || !res.body) {
      const errorBody = await res.text()
      throw new Error(`Sarvam stream failed: ${res.status} ${errorBody}`)
    }

    // Transform SSE stream to extract content deltas
    const transformer = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)
        const lines = text.split("\n").filter(l => l.trim() !== "")

        for (const line of lines) {
          // SSE format: "data: {json}"
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim()
            if (jsonStr === "[DONE]") continue

            try {
              const json = JSON.parse(jsonStr)
              const delta = json.choices?.[0]?.delta?.content
              if (delta) {
                controller.enqueue(new TextEncoder().encode(delta))
              }
            } catch {
              // Partial JSON or parse error — skip
            }
          }
        }
      }
    })

    return res.body.pipeThrough(transformer)
  } catch (error: any) {
    console.error("❌ [SARVAM STREAM] Error:", error.message)
    throw error
  }
}
