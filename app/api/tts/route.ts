import { synthesizeSpeech } from "@/lib/tts/sarvam_tts"

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Strips emojis for safety before sending to synthesizeSpeech
 */
function safetyStrip(text: string): string {
  return text
    .replace(/\p{Emoji}/gu, "")
    .trim()
}

export async function POST(req: Request) {
  try {
    const { text, language_code } = await req.json()

    if (!text) {
      return new Response(null, { status: 204 })
    }

    const cleaned = safetyStrip(text)

    if (!cleaned || cleaned.length < 1) {
      console.log("[TTS Route] Skipping empty text after emoji stripping")
      return new Response(null, { status: 204 })
    }

    const { audio, contentType } = await synthesizeSpeech(cleaned, language_code || "ta-IN")

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": audio.length.toString(),
        "Cache-Control": "no-cache"
      }
    })
  } catch (error: any) {
    console.error("[TTS Route] ❌ Error:", error.message)
    return new Response(JSON.stringify({
      error: "TTS Synthesis Failed",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}