import { GoogleGenerativeAI } from "@google/generative-ai"

export async function generateContentGemini(
  apiKey: string,
  modelName: string,
  systemInstruction: string,
  prompt: string
) {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing")
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction
  })

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  if (!text) {
    throw new Error("Empty response from Gemini API")
  }

  return text
}
