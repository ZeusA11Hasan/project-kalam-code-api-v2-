import { NextRequest, NextResponse } from "next/server"
import { transcribeAudio } from "@/lib/stt/sarvam_stt"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const audio = form.get("file") as File | null
    const language_code = form.get("language_code") as string || "ta-IN"

    if (!audio) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log(`[STT Route] 🎙️ Processing ${audio.type} (${audio.size} bytes) for ${language_code}`);

    // Re-wrap the blob to plain audio/webm to strip any codec info (e.g. ;codecs=opus)
    const arrayBuffer = await audio.arrayBuffer()
    const cleanBlob = new Blob([arrayBuffer], { type: "audio/webm" })

    // transcribeAudio handles the API call
    const result = await transcribeAudio(cleanBlob, language_code)

    if (!result.transcript) {
      return NextResponse.json({ error: "Empty transcript", text: "" }, { status: 200 })
    }

    console.log("[STT Route] ✅ Success:", result.transcript);

    return NextResponse.json({
      text: result.transcript,
      language_code: result.language_code || language_code
    })
  } catch (error: any) {
    console.error("[STT Route] Error:", error.message)
    return NextResponse.json(
      { error: error.message || "Unknown STT error" },
      { status: 500 }
    )
  }
}
