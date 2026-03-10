export type WhiteboardCommand =
  | { type: "line"; from: [number, number]; to: [number, number] }
  | { type: "curve"; curveType: string; points: number[][] }
  | { type: "label"; text: string; position: [number, number] }

export function parseWhiteboardCommands(input: string): WhiteboardCommand[] {
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
        const text = textMatch[1]
        const pos = posMatch.slice(1).map(Number) as [number, number]
        parsed.push({ type: "label", text, position: pos })
      }
    }
  }
  return parsed
}
