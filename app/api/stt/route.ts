import { NextRequest, NextResponse } from "next/server"
import { transcribeAudio } from "@/lib/stt/sarvam_stt"

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const audio = form.get("file") as File | null

    if (!audio) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    const result = await transcribeAudio(audio)

    return NextResponse.json({
      text: result.transcript,
      language_code: result.language_code
    })
  } catch (error: unknown) {
    console.error("STT Error:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    )
  }
}
