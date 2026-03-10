export interface WhiteboardCommand {
  type: "line" | "curve" | "label" | "bezier"
  from?: [number, number]
  to?: [number, number]
  curveType?: string
  points?: number[][]
  text?: string
  position?: [number, number]
  // Bezier specific
  start?: { x: number; y: number }
  control1?: { x: number; y: number }
  control2?: { x: number; y: number }
  end?: { x: number; y: number }
  color?: string
  width?: number
}

export function parseWhiteboardCommands(input: string): WhiteboardCommand[] {
  if (!input) return []

  // If input is already a JSON string (starts with [ or {), try to parse it directly
  const trimmed = input.trim()
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (e) {
      console.warn(
        "Failed to parse JSON input, falling back to regex parser",
        e
      )
    }
  }

  const commands = input
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
  const parsed: WhiteboardCommand[] = []

  for (const cmd of commands) {
    if (cmd.startsWith("DRAW_LINE")) {
      const m = cmd.match(/DRAW_LINE\((\d+),(\d+)\s*→\s*(\d+),(\d+)\)/)
      if (!m) continue
      parsed.push({
        type: "line",
        from: [parseInt(m[1]), parseInt(m[2])],
        to: [parseInt(m[3]), parseInt(m[4])]
      })
    } else if (cmd.startsWith("DRAW_CURVE")) {
      const typeMatch = cmd.match(/type="(.*?)"/)
      const pointsMatch = cmd.match(/points=\[(.*?)\]/)
      // Parse points: (0,0),(1,1) -> [[0,0], [1,1]]
      const pts = pointsMatch
        ? pointsMatch[1]
            .split("),")
            .map(p => p.replace(/[()]/g, "").split(",").map(Number))
        : []
      parsed.push({
        type: "curve",
        curveType: typeMatch ? typeMatch[1] : "parabola",
        points: pts
      })
    } else if (cmd.startsWith("ADD_LABEL")) {
      const textMatch = cmd.match(/"(.+?)"/)
      const posMatch = cmd.match(/position=\((\d+),(\d+)\)/)

      if (textMatch && posMatch) {
        parsed.push({
          type: "label",
          text: textMatch[1],
          position: [parseInt(posMatch[1]), parseInt(posMatch[2])]
        })
      }
    }
  }
  return parsed
}
