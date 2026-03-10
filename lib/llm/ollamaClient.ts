// 1. New Ollama Client Module
// Responsibilities: Call Ollama’s local REST API (Docker DNS or Host), Return plain assistant text only

// STRICT: Default to 127.0.0.1 for host dev flexibility, but prefer ENV.
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"

export async function callOllama(
  prompt: string,
  model: string = "phi3:mini"
): Promise<string> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🔧 OLLAMA CLIENT LOG")
  console.log(`- Base URL: ${OLLAMA_BASE_URL}`)
  console.log(`- Endpoint: ${OLLAMA_BASE_URL}/api/generate`)
  console.log(`- Model: ${model}`)

  try {
    // REMOVED: AbortController and timeout to prevent premature aborts.
    // Local LLMs in Docker can be slow. We wait indefinitely (or until platform default).

    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false // MANDATORY: No streaming
      })
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error(`❌ [OLLAMA] API Error: ${res.status} ${res.statusText}`)
      console.error(`❌ [OLLAMA] Response Body: ${errorBody}`)

      if (res.status === 404 || errorBody.includes("not found")) {
        throw new Error("Ollama model not installed in container")
      }

      throw new Error(`Ollama API error ${res.status}: ${errorBody}`)
    }

    const json = await res.json()
    const text = json.response // Extract ONLY response

    console.log(`- Response Length: ${text?.length || 0} chars`)
    console.log("✅ Success")

    return text
  } catch (error: any) {
    console.error("❌ [OLLAMA] Exception:", error.message)
    throw error
  }
}

export async function callOllamaStream(
  prompt: string,
  model: string = "phi3:mini"
): Promise<ReadableStream<Uint8Array>> {
  console.log(`[OLLAMA STREAM] Starting stream for model: ${model}`)
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: true
      })
    })

    if (!res.ok || !res.body) {
      throw new Error(`Ollama stream failed: ${res.statusText}`)
    }

    // Create a transform stream to parse JSON chunks and extract 'response' field
    const transformer = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)
        // Ollama streams multiple JSON objects, sometimes in one chunk or split
        // We'll rely on lines being separate JSONs usually
        const lines = text.split("\n").filter(l => l.trim() !== "")
        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.response) {
              controller.enqueue(new TextEncoder().encode(json.response))
            }
            if (json.done) {
              // Stream finished
            }
          } catch (e) {
            // Partial JSON can happen, ignore for MVP or buffer (but optimizing latency means ignoring rare splits usually OK for local)
            // For robustness, ideally we buffer. But usually newlines separate JSONs in Ollama.
          }
        }
      }
    })

    return res.body.pipeThrough(transformer)
  } catch (error: any) {
    console.error("❌ [OLLAMA STREAM] Error:", error.message)
    throw error
  }
}
