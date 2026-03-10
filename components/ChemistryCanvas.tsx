"use client"

import { useRef, useEffect, useState } from "react"
import type {
  ChemCanvasPayload,
  ChemStructure,
  ChemReaction,
  ChemMechanism,
  BondChange
} from "./chemistryTypes"

type Props = { payload: ChemCanvasPayload | null }

export default function ChemistryCanvas({ payload }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [mechStep, setMechStep] = useState(0)

  // Reset step when payload changes
  useEffect(() => {
    setMechStep(0)
  }, [payload])

  // Animation Loop for Mechanism
  useEffect(() => {
    if (!payload || payload.type !== "mechanism") return

    const steps = payload.data.steps
    if (!steps || steps.length === 0) return

    // Loop: 0 (Base) -> Step 1 -> Step 2 ... -> 0
    // The user schema has steps array.
    // Let's assume index 0 = first step.
    // If I want a "start" state without arrows, I can treat -1 or something.
    // Let's just loop steps.

    const timer = setInterval(() => {
      setMechStep(prev => (prev + 1) % (steps.length + 1))
      // +1 to allow a "clean" state (step 0) or just cycle steps?
      // Let's cycle: Step 0 (Clean Base) -> Step 1 (Arrows) -> ...
    }, 2000)
    return () => clearInterval(timer)
  }, [payload])

  useEffect(() => {
    if (!payload || !ref.current) return
    const ctx = ref.current.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, ref.current.width, ref.current.height)
    // Default style
    ctx.strokeStyle = "#fff"
    ctx.fillStyle = "#fff"
    ctx.lineWidth = 2

    if (payload.type === "structure") {
      // Draw single structure centered
      drawStructureAt(ctx, payload.data as ChemStructure, 400)
    } else if (payload.type === "reaction") {
      drawReaction(ctx, payload.data as ChemReaction)
    } else if (payload.type === "mechanism") {
      drawMechanism(ctx, payload.data as ChemMechanism, mechStep)
    }
  }, [payload, mechStep])

  return (
    <div className="relative size-full">
      <canvas
        ref={ref}
        width={800} // Matched WhiteboardCanvas width
        height={500} // Matched WhiteboardCanvas height
        style={{
          width: "100%",
          height: "100%",
          background: "#0b0b0b",
          borderRadius: "12px" // Matching WhiteboardCanvas style
        }}
      />
      {payload?.type === "mechanism" && (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded bg-black/50 px-3 py-1 text-xs text-white/70">
          Mechanism Step {mechStep > 0 ? mechStep : "Start"}
        </div>
      )}
    </div>
  )
}

function drawMechanism(
  ctx: CanvasRenderingContext2D,
  mechanism: ChemMechanism,
  stepIndex: number // 0 = Clean Base? Or 1-based?
  // Let's say: 0 = Clean Base. 1 = Step[0], 2 = Step[1]...
) {
  // 1. Draw Base Structure
  drawStructureAt(ctx, mechanism.baseStructure, 400)

  if (stepIndex === 0) return // Just base structure

  const step = mechanism.steps[stepIndex - 1]
  if (!step) return

  // 2. Draw Arrows
  if (step.arrows) {
    step.arrows.forEach(arrow => {
      drawCurvedArrow(ctx, arrow.from, arrow.to)
    })
  }

  // 3. Highlight Bond Changes
  if (step.bondChanges) {
    step.bondChanges.forEach(change => {
      highlightBond(ctx, mechanism.baseStructure, change)
    })
  }

  // 4. Description
  if (step.description) {
    ctx.fillStyle = "#aaa"
    ctx.font = "italic 14px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(step.description, 400, 450)
  }
}

function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number]
) {
  const scale = 60 // Match drawStructureAt
  const ox = 400 // Match drawStructureAt
  const oy = 250 // Match drawStructureAt

  const [x1, y1] = [ox + from[0] * scale, oy - from[1] * scale]
  const [x2, y2] = [ox + to[0] * scale, oy - to[1] * scale]

  const cx = (x1 + x2) / 2
  // Curve control point: lift "up" (lower y) relative to straight line
  // Simple heuristic: move perpendicular or just up?
  // Prompt suggested: `Math.min(y1, y2) - 30`.
  const cy = Math.min(y1, y2) - 60 // Slightly more curve

  ctx.strokeStyle = "#00eaff" // Cyan for electrons
  ctx.lineWidth = 2

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(cx, cy, x2, y2)
  ctx.stroke()

  // Arrow head at (x2, y2)
  // Approximate angle
  // Bezier derivative at t=1 is 2*(P2 - P1) for quad curve?
  // Tangent at end triggers from Control Point (cx, cy) to End (x2, y2)
  const angle = Math.atan2(y2 - cy, x2 - cx)
  const headSize = 6

  ctx.beginPath()
  ctx.fillStyle = "#00eaff"
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - headSize * Math.cos(angle - Math.PI / 6),
    y2 - headSize * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    x2 - headSize * Math.cos(angle + Math.PI / 6),
    y2 - headSize * Math.sin(angle + Math.PI / 6)
  )
  ctx.fill()

  // Reset style
  ctx.strokeStyle = "#fff"
  ctx.fillStyle = "#fff"
}

function highlightBond(
  ctx: CanvasRenderingContext2D,
  s: ChemStructure,
  change: BondChange
) {
  const scale = 60
  const ox = 400
  const oy = 250

  const pos = (p: [number, number]) => [ox + p[0] * scale, oy - p[1] * scale]

  const a = s.atoms.find(x => x.id === change.from)
  const b = s.atoms.find(x => x.id === change.to)

  if (a && b) {
    const [x1, y1] = pos(a.position)
    const [x2, y2] = pos(b.position)

    ctx.strokeStyle = change.change === "break" ? "#ff4444" : "#44ff44" // Red for break, Green for form
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    ctx.lineWidth = 2 // Reset
    ctx.strokeStyle = "#fff"
  }
}

function drawReaction(ctx: CanvasRenderingContext2D, reaction: ChemReaction) {
  const spacing = 250
  let xOffset = 150 // Start offset

  // Draw reactants
  reaction.reactants.forEach(r => {
    drawStructureAt(ctx, r, xOffset)
    xOffset += spacing
  })

  // Draw arrow
  // Adjust position based on last structure
  drawReactionArrow(ctx, xOffset - spacing / 2, 250, reaction.arrow)
  xOffset += spacing / 2 // Move past arrow

  // Draw products
  reaction.products.forEach(p => {
    drawStructureAt(ctx, p, xOffset)
    xOffset += spacing
  })
}

function drawReactionArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: "forward" | "equilibrium" = "forward"
) {
  const arrowLength = 40

  ctx.beginPath()
  ctx.moveTo(x - arrowLength, y)
  ctx.lineTo(x + arrowLength, y)
  ctx.stroke()

  // Arrow head
  ctx.beginPath()
  ctx.moveTo(x + arrowLength, y)
  ctx.lineTo(x + arrowLength - 10, y - 6)
  ctx.lineTo(x + arrowLength - 10, y + 6)
  ctx.closePath()
  ctx.fill()

  if (type === "equilibrium") {
    // Draw lower half arrow for equilibrium (simplified representation)
    // Or specific equilibrium arrow style
    ctx.beginPath()
    ctx.moveTo(x - arrowLength, y + 10)
    ctx.lineTo(x + arrowLength, y + 10)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x - arrowLength, y + 10)
    ctx.lineTo(x - arrowLength + 10, y + 16)
    ctx.lineTo(x - arrowLength + 10, y + 4)
    ctx.closePath()
    ctx.fill()
  }
}

function drawStructureAt(
  ctx: CanvasRenderingContext2D,
  s: ChemStructure,
  centerX: number
) {
  // Determine bounds to center the molecule might be nice, but using fixed scale/offset for now as per prompt example
  const scale = 60 // Slightly smaller to fit 800x500 better
  const ox = centerX
  const oy = 250 // Center Y

  const pos = (p: [number, number]) => [ox + p[0] * scale, oy - p[1] * scale]

  // Bonds first
  s.bonds.forEach(b => {
    const a = s.atoms.find(x => x.id === b.from)
    const c = s.atoms.find(x => x.id === b.to)
    if (!a || !c) return

    const [x1, y1] = pos(a.position)
    const [x2, y2] = pos(c.position)

    if (b.order === 1) drawLine(ctx, x1, y1, x2, y2)
    if (b.order === 2) drawDoubleBond(ctx, x1, y1, x2, y2)
    if (b.order === 3) drawTripleBond(ctx, x1, y1, x2, y2)
  })

  // Atoms
  s.atoms.forEach(a => {
    // Skip C atoms if skeletal? No, prompt says "atoms" are explicit.
    // Prompt example shows C atoms being rendered.
    const [x, y] = pos(a.position)

    // Draw background circle to clear bond lines behind text
    ctx.fillStyle = "#0b0b0b"
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#fff"
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(a.element, x, y)
  })
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawDoubleBond(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const dx = y2 - y1
  const dy = x1 - x2
  const norm = Math.sqrt(dx * dx + dy * dy) || 1
  const off = 4 // Gap offset

  drawLine(
    ctx,
    x1 + (dx / norm) * off,
    y1 + (dy / norm) * off,
    x2 + (dx / norm) * off,
    y2 + (dy / norm) * off
  )
  drawLine(
    ctx,
    x1 - (dx / norm) * off,
    y1 - (dy / norm) * off,
    x2 - (dx / norm) * off,
    y2 - (dy / norm) * off
  )
}

function drawTripleBond(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  drawLine(ctx, x1, y1, x2, y2)
  drawDoubleBond(ctx, x1, y1, x2, y2)
}
