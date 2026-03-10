import type { CanvasPayload, CanvasElement } from "@/components/canvasTypes"
import type { ChemCanvasPayload } from "@/components/chemistryTypes"

type WhiteboardData = CanvasPayload | ChemCanvasPayload

function isNumberTuple(v: any): v is [number, number] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number"
  )
}

function validateElement(el: any): el is CanvasElement {
  if (!el || typeof el !== "object") return false

  switch (el.type) {
    case "line":
    case "arrow":
      return (
        (isNumberTuple(el.from) && isNumberTuple(el.to)) ||
        (Array.isArray(el.from) && Array.isArray(el.to)) // Allow loose array check
      )

    case "point":
      return isNumberTuple(el.at)

    case "label":
      return typeof el.text === "string" && isNumberTuple(el.at)

    case "text":
      return (
        typeof el.value === "string" &&
        typeof el.x === "number" &&
        typeof el.y === "number"
      )

    case "box":
      return (
        // Label is optional
        (el.label === undefined || typeof el.label === "string") &&
        typeof el.x === "number" &&
        typeof el.y === "number"
      )

    case "curve":
      return typeof el.equation === "string" && Array.isArray(el.range)

    default:
      return false
  }
}

function validateChemistry(parsed: any): boolean {
  if (parsed.type === "structure") return true
  if (parsed.type === "reaction") return true
  if (parsed.type === "mechanism") return true
  return false
}

export function parseCanvasBlock(raw: any): WhiteboardData | null {
  try {
    // Raw input might be the direct parsed JSON object from route.ts (now that we control the response)
    // OR it might be a string from the message loop.
    // The previous logic expected raw text with <canvas> tags.
    // We'll support both:
    // 1. Direct Object (from API -> Chat UI mapping)
    // 2. String parsing (legacy)

    let parsed = raw

    if (typeof raw === "string") {
      const match = raw.match(/<canvas>([\s\S]*?)<\/canvas>/)
      if (match) {
        parsed = JSON.parse(match[1].trim())
      } else {
        // Try parsing raw JSON if it doesn't have tags
        try {
          parsed = JSON.parse(raw)
        } catch {}
      }
    }

    if (!parsed || typeof parsed !== "object") return null

    // 1. CHEMISTRY PAYLOAD CHECK
    if (
      parsed.type === "structure" ||
      parsed.type === "reaction" ||
      parsed.type === "mechanism"
    ) {
      return parsed as ChemCanvasPayload
    }

    // 2. NEW SCHEMA CHECK (User Request)
    if (Array.isArray(parsed.steps) && Array.isArray(parsed.elements)) {
      // Validate elements
      const validElements = parsed.elements.filter(validateElement)
      return {
        title: parsed.title,
        steps: parsed.steps, // string[]
        elements: validElements
      } as CanvasPayload
    }

    // 3. LEGACY FORMAT FALLBACK
    let steps: any[] = []
    if (Array.isArray(parsed.elements)) {
      steps = [{ stepId: 1, elements: parsed.elements }]
    } else if (Array.isArray(parsed.steps)) {
      steps = parsed.steps
    }

    const validLegacySteps: any[] = []
    for (const step of steps) {
      if (typeof step.stepId !== "number" || !Array.isArray(step.elements))
        continue
      const validElements = step.elements.filter(validateElement)
      if (validElements.length > 0) {
        validLegacySteps.push({
          stepId: step.stepId,
          title: step.title,
          elements: validElements
        })
      }
    }

    if (validLegacySteps.length > 0) {
      return {
        axes: Boolean(parsed.axes),
        legacySteps: validLegacySteps
      }
    }

    return null
  } catch (e) {
    console.error("Canvas Parse Error", e)
    return null
  }
}
