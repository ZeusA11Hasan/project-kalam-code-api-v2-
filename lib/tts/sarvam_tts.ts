import { Buffer } from "buffer"

// ─── Strip non-Tamil-safe characters ──────────────────────
function cleanTextForSarvam(text: string): string {
  return text
    .replace(/\p{Emoji}/gu, "")
    .replace(/[\u2600-\u27FF]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[\u0900-\u097F]/g, "")    // Strip Hindi/Devanagari
    .replace(/[*#`_~]/g, "")           // Strip markdown
    .replace(/\s+/g, " ")
    .trim()
}

// ─── Main TTS Function ─────────────────────────────────────
export async function synthesizeSpeech(
  text: string,
  languageCode: string = "ta-IN"
): Promise<{ audio: Buffer; contentType: string }> {
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) throw new Error("SARVAM_API_KEY is not defined")

  const cleanedText = cleanTextForSarvam(text)

  if (!cleanedText || cleanedText.length < 2) {
    throw new Error("Text empty after cleaning")
  }

  console.log(`[Sarvam TTS] Sending: "${cleanedText.slice(0, 60)}..."`)

  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "bulbul:v2",
      language_code: "ta-IN",
      target_language_code: "ta-IN",
      text: cleanedText,
      speaker: "vidya",
      pace: 0.9
    }),
    signal: AbortSignal.timeout(60000)
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Sarvam API ${response.status}: ${err}`)
  }

  const contentType = response.headers.get("content-type") || "audio/wav"

  if (contentType.includes("audio") || contentType.includes("octet-stream")) {
    return {
      audio: Buffer.from(await response.arrayBuffer()),
      contentType: contentType.includes("octet-stream") ? "audio/wav" : contentType
    }
  } else {
    const data = await response.json()
    const base64 = data.audios?.[0] || data.audio || ""
    if (!base64) throw new Error("No audio in response")
    return {
      audio: Buffer.from(base64, "base64"),
      contentType: "audio/wav"
    }
  }
}