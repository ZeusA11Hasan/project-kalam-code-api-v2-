import type { CanvasPayload } from "@/components/canvasTypes"
import { detectGraphFunction } from "./detectGraph"
import { defaultRange } from "./defaultRange"

export function graphLatexToCanvas(
  latex: string,
  wantsBoard: boolean
): CanvasPayload | null {
  if (!wantsBoard) return null

  const expr = detectGraphFunction(latex)
  if (!expr) return null

  const range = defaultRange(expr)

  return {
    axes: true,
    elements: [
      {
        type: "curve",
        equation: expr,
        range
      },
      {
        type: "label",
        text: "y = f(x)",
        at: [range[1] - 1, 2]
      }
    ]
  }
}
