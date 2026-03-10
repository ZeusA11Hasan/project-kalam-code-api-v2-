export async function synthesizeSpeech(
  text: string,
  languageCode: string = "en-IN"
): Promise<ArrayBuffer> {
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) throw new Error("SARVAM_API_KEY not defined")

  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: languageCode,
      speaker: "anushka",
      model: "bulbul:v2",
      enable_preprocessing: true
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Sarvam TTS failed: ${response.status} - ${err}`)
  }

  const data = await response.json()
  // Response has "audios" array — each item is base64 WAV string
  const base64Audio = data.audios[0]
  const binaryStr = atob(base64Audio)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes.buffer
}
