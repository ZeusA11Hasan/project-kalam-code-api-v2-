import { NextRequest, NextResponse } from "next/server"
import { synthesizeSpeech } from "@/lib/tts/sarvam_tts"

export async function POST(req: NextRequest) {
    try {
        const { text, language_code } = await req.json()

        console.log("[TTS Route] Called ✅")
        console.log("[TTS Route] Text length:", text?.length)
        console.log("[TTS Route] Text preview:", text?.slice(0, 80))
        console.log("[TTS Route] Language:", language_code)
        console.log("[TTS Route] API Key exists:", !!process.env.SARVAM_API_KEY)
        console.log("[TTS Route] API Key preview:",
            process.env.SARVAM_API_KEY?.slice(0, 8) + "...")

        if (!text) {
            console.log("[TTS Route] ❌ No text provided")
            return NextResponse.json({ error: "No text provided" }, { status: 400 })
        }

        const audioBuffer = await synthesizeSpeech(text, language_code || "en-IN")
        console.log("[TTS Route] ✅ Audio buffer size:", audioBuffer.byteLength)

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Disposition": "inline"
            }
        })
    } catch (error: unknown) {
        console.error("[TTS Route] ❌ Error:", error)
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ error: "Unknown TTS error" }, { status: 500 })
    }
}
