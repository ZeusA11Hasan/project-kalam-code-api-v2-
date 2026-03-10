const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://ollama:11434" // Default to Docker DNS

async function checkModelAvailability(modelName: string): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    if (!res.ok) throw new Error("Failed to fetch Ollama tags")
    const json = await res.json()
    const availableModels = json.models?.map((m: any) => m.name) || []
    // Allow partial match
    const exists = availableModels.some((m: string) => m.includes(modelName))

    console.log(
      `[OLLAMA] Model Verification: ${modelName} -> ${exists ? "FOUND" : "MISSING"}`
    )
    return exists
  } catch (error: any) {
    console.warn("[OLLAMA] Verification failed (Non-critical):", error.message)
    return true // Assume available if check fails (e.g. network strictness) to avoid blocking
  }
}

export async function callOllama(
  prompt: string,
  model: string = "qwen2.5:7b"
): Promise<string> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("🔧 LLAMA PROVIDER LOG")
  console.log(`- Provider: Ollama`)
  console.log(`- Base URL: ${OLLAMA_BASE_URL}`)
  console.log(`- Model: ${model}`)

  // 1. Warmup / Check
  await checkModelAvailability(model)

  try {
    const controller = new AbortController()
    // STEP 4: TIMEOUT FIX - 300,000 ms (5 minutes)
    const timeoutId = setTimeout(() => controller.abort(), 300000)

    // STEP 2: API ENDPOINT
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false // STEP 3: NON-STREAMING
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Ollama API Error: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    const text = json.response

    console.log(`- Response Length: ${text?.length || 0} chars`)
    console.log("✅ Success")
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return text
  } catch (error: any) {
    console.error("❌ [OLLAMA] Connection Failed:", error.message)
    if (error.name === "AbortError") {
      throw new Error(
        "Ollama request timed out after 300s (5 min). Suggestion: Preload model using 'docker exec -it ollama ollama run " +
          model +
          "'"
      )
    }
    throw error
  }
}
