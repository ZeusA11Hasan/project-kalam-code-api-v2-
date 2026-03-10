/**
 * AI Response Parser with n8n Fallback
 * Handles parsing AI responses for whiteboard commands and text
 */

import { getSystemPrompt } from "./ai-tutor-prompts"

interface AIResponse {
  text: string
  latex?: string
  whiteboard_action?: "draw" | "clear"
  commands?: any[]
}

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

// n8n endpoint URL (configured in .env.local)
const N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
  "http://localhost:5678/webhook/ai-tutor"

/**
 * Send request to n8n workflow
 */
export async function sendToN8n(
  messages: ChatMessage[],
  options: {
    mode?: "whiteboard" | "latex" | "ncert" | "tutor"
    forceWhiteboard?: boolean
    allowWhiteboard?: boolean
  } = {}
): Promise<AIResponse> {
  const {
    mode = "tutor",
    forceWhiteboard = false,
    allowWhiteboard = true
  } = options

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages,
        mode,
        force_whiteboard: forceWhiteboard,
        allow_whiteboard: allowWhiteboard
      })
    })

    if (!response.ok) {
      throw new Error(`n8n request failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.warn("n8n request failed, falling back to local parsing:", error)
    return fallbackParse(messages, mode)
  }
}

/**
 * Fallback local parsing when n8n is not available
 * This provides basic functionality without the backend
 */
export function fallbackParse(
  messages: ChatMessage[],
  mode: "whiteboard" | "latex" | "ncert" | "tutor"
): AIResponse {
  const lastMessage = messages[messages.length - 1]

  if (!lastMessage || lastMessage.role !== "user") {
    return { text: "No user message to process." }
  }

  const content = lastMessage.content.toLowerCase()

  // Check if user wants whiteboard drawing
  const drawKeywords = [
    "draw",
    "show",
    "illustrate",
    "visualize",
    "diagram",
    "sketch"
  ]
  const wantsDrawing = drawKeywords.some(kw => content.includes(kw))

  if (wantsDrawing || mode === "whiteboard") {
    return generateSampleDrawing(lastMessage.content)
  }

  // Return placeholder response (in production, this would call OpenAI directly)
  return {
    text: `[Fallback Mode] I received your message: "${lastMessage.content}"\n\nTo enable full AI responses, please configure the n8n webhook at ${N8N_WEBHOOK_URL}.`
  }
}

/**
 * Generate sample drawing commands based on common requests
 */
function generateSampleDrawing(userMessage: string): AIResponse {
  const content = userMessage.toLowerCase()

  // Triangle
  if (content.includes("triangle")) {
    return {
      text: "",
      whiteboard_action: "draw",
      commands: [
        { type: "line", from: [200, 400], to: [600, 400] },
        { type: "line", from: [600, 400], to: [400, 100] },
        { type: "line", from: [400, 100], to: [200, 400] },
        { type: "label", text: "Triangle", position: [350, 450] }
      ]
    }
  }

  // Circle
  if (content.includes("circle")) {
    return {
      text: "",
      whiteboard_action: "draw",
      commands: [
        { type: "circle", center: [400, 300], radius: 150 },
        { type: "label", text: "Circle", position: [370, 470] }
      ]
    }
  }

  // Coordinate axes
  if (
    content.includes("axis") ||
    content.includes("axes") ||
    content.includes("graph")
  ) {
    return {
      text: "",
      whiteboard_action: "draw",
      commands: [
        { type: "arrow", from: [100, 300], to: [700, 300] },
        { type: "arrow", from: [400, 550], to: [400, 50] },
        { type: "label", text: "X", position: [710, 290] },
        { type: "label", text: "Y", position: [410, 40] },
        { type: "label", text: "O", position: [380, 310] }
      ]
    }
  }

  // Default: simple demo
  return {
    text: "",
    whiteboard_action: "draw",
    commands: [
      {
        type: "label",
        text: "AI Tutor Whiteboard",
        position: [280, 50],
        fontSize: 24
      },
      { type: "line", from: [200, 100], to: [600, 100] },
      {
        type: "label",
        text: "Request: " + userMessage.slice(0, 50),
        position: [150, 150]
      },
      { type: "circle", center: [400, 350], radius: 100 }
    ]
  }
}

/**
 * Parse AI response to extract whiteboard commands
 */
export function parseAIResponse(content: string): AIResponse {
  const trimmed = content.trim()

  // Check if it's pure JSON (whiteboard commands)
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed)
      const commands = Array.isArray(parsed) ? parsed : [parsed]
      return {
        text: "",
        whiteboard_action: "draw",
        commands
      }
    } catch (e) {
      // Not valid JSON, continue as text
    }
  }

  // Check for embedded JSON in response
  const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])
      const commands = Array.isArray(parsed) ? parsed : [parsed]
      const textWithoutJson = trimmed.replace(/```json[\s\S]*?```/, "").trim()
      return {
        text: textWithoutJson,
        whiteboard_action: "draw",
        commands
      }
    } catch (e) {
      // Invalid JSON in code block
    }
  }

  // Plain text response
  return { text: content }
}
