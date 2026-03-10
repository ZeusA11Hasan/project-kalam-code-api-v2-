import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import fs from "fs/promises"
import path from "path"
import os from "os"
import util from "util"

const execPromise = util.promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "en-US-AriaNeural" } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    const runId = Date.now()
    const tempTextFile = path.join(os.tmpdir(), `text-${runId}.txt`)
    const tempMediaFile = path.join(os.tmpdir(), `media-${runId}.mp3`)

    // Write text to a temp file safely
    await fs.writeFile(tempTextFile, text, "utf-8")

    // Spawn python edge-tts CLI (already installed in the user's system)
    await execPromise(
      `edge-tts --voice ${voice} -f "${tempTextFile}" --write-media "${tempMediaFile}"`
    )

    // Read the generated audio file
    const audioBuffer = await fs.readFile(tempMediaFile)

    // Clean up temp files
    await fs.unlink(tempTextFile).catch(() => {})
    await fs.unlink(tempMediaFile).catch(() => {})

    return new Response(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString()
      }
    })
  } catch (error: any) {
    console.error("Edge TTS Server Error:", error)
    return NextResponse.json(
      { error: "Edge TTS failed: " + error.message },
      { status: 500 }
    )
  }
}
