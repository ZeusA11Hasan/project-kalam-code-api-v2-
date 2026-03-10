"use client"

import { useMemo } from "react"
import {
  TextElement,
  ArrowElement,
  LineElement,
  ShapeElement,
  WhiteboardElement,
  resolveCoordinates,
  resolveElementSize,
  WhiteboardData,
  getDefaultLayer,
  Point
} from "@/types/whiteboard"

interface SvgOverlayProps {
  elements: WhiteboardElement[]
  viewport: WhiteboardData
}

type SvgElement = TextElement | ArrowElement | LineElement | ShapeElement

function isSvgElement(el: WhiteboardElement): el is SvgElement {
  return ["text", "arrow", "line", "shape"].includes(el.type)
}

/**
 * SVG-only overlay for text labels, arrows, lines, and shapes.
 * Provides sharp, non-blurred rendering for annotations.
 */
export function SvgOverlay({ elements, viewport }: SvgOverlayProps) {
  // Filter to only SVG-compatible elements
  const svgElements = useMemo(
    () => elements.filter(isSvgElement).filter(el => el.visible !== false),
    [elements]
  )

  if (svgElements.length === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={viewport.width}
      height={viewport.height}
      style={{ zIndex: 100 }}
    >
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
        </marker>
        <marker
          id="arrowhead-blue"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-red"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>
      </defs>

      {svgElements.map(element => {
        switch (element.type) {
          case "text":
            return (
              <TextSvgElement
                key={element.id}
                element={element}
                viewport={viewport}
              />
            )
          case "arrow":
            return (
              <ArrowSvgElement
                key={element.id}
                element={element}
                viewport={viewport}
              />
            )
          case "line":
            return (
              <LineSvgElement
                key={element.id}
                element={element}
                viewport={viewport}
              />
            )
          case "shape":
            return (
              <ShapeSvgElement
                key={element.id}
                element={element}
                viewport={viewport}
              />
            )
          default:
            return null
        }
      })}
    </svg>
  )
}

// ============================================
// TEXT ELEMENT
// ============================================

function TextSvgElement({
  element,
  viewport
}: {
  element: TextElement
  viewport: Pick<WhiteboardData, "width" | "height" | "coordinateSystem">
}) {
  const pos = resolveCoordinates(element, viewport)

  const anchor = useMemo(() => {
    switch (element.anchor) {
      case "center":
        return "middle"
      case "top-center":
        return "middle"
      default:
        return "start"
    }
  }, [element.anchor])

  const dy = useMemo(() => {
    switch (element.anchor) {
      case "center":
        return "0.35em"
      default:
        return "0.85em"
    }
  }, [element.anchor])

  return (
    <text
      x={pos.x}
      y={pos.y}
      fill={element.color ?? "#1a1a1a"}
      fontSize={element.fontSize ?? 14}
      fontWeight={element.fontWeight ?? "normal"}
      fontFamily="system-ui, -apple-system, sans-serif"
      textAnchor={anchor}
      dy={dy}
    >
      {element.content}
    </text>
  )
}

// ============================================
// ARROW ELEMENT
// ============================================

function ArrowSvgElement({
  element,
  viewport
}: {
  element: ArrowElement
  viewport: Pick<WhiteboardData, "width" | "height" | "coordinateSystem">
}) {
  const from = resolvePoint(element.from, viewport)
  const to = resolvePoint(element.to, viewport)
  const color = element.color ?? "#374151"

  // Select appropriate marker based on color
  const markerId = useMemo(() => {
    if (color.includes("blue") || color === "#3b82f6")
      return "url(#arrowhead-blue)"
    if (color.includes("red") || color === "#ef4444")
      return "url(#arrowhead-red)"
    return "url(#arrowhead)"
  }, [color])

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={color}
      strokeWidth={element.strokeWidth ?? 2}
      markerEnd={markerId}
    />
  )
}

// ============================================
// LINE ELEMENT
// ============================================

function LineSvgElement({
  element,
  viewport
}: {
  element: LineElement
  viewport: Pick<WhiteboardData, "width" | "height" | "coordinateSystem">
}) {
  const from = resolvePoint(element.from, viewport)
  const to = resolvePoint(element.to, viewport)

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={element.color ?? "#374151"}
      strokeWidth={element.strokeWidth ?? 2}
      strokeDasharray={element.dashed ? "5,5" : undefined}
    />
  )
}

// ============================================
// SHAPE ELEMENT
// ============================================

function ShapeSvgElement({
  element,
  viewport
}: {
  element: ShapeElement
  viewport: Pick<WhiteboardData, "width" | "height" | "coordinateSystem">
}) {
  const pos = resolveCoordinates(element, viewport)
  const size = resolveElementSize(element.width, element.height, viewport)

  switch (element.shapeType) {
    case "circle":
      return (
        <circle
          cx={pos.x + size.width / 2}
          cy={pos.y + size.height / 2}
          r={Math.min(size.width, size.height) / 2}
          fill={element.fill ?? "none"}
          stroke={element.stroke ?? "#374151"}
          strokeWidth={element.strokeWidth ?? 2}
        />
      )

    case "ellipse":
      return (
        <ellipse
          cx={pos.x + size.width / 2}
          cy={pos.y + size.height / 2}
          rx={size.width / 2}
          ry={size.height / 2}
          fill={element.fill ?? "none"}
          stroke={element.stroke ?? "#374151"}
          strokeWidth={element.strokeWidth ?? 2}
        />
      )

    case "rectangle":
    default:
      return (
        <rect
          x={pos.x}
          y={pos.y}
          width={size.width}
          height={size.height}
          fill={element.fill ?? "none"}
          stroke={element.stroke ?? "#374151"}
          strokeWidth={element.strokeWidth ?? 2}
          rx="4"
        />
      )
  }
}

// ============================================
// UTILITIES
// ============================================

function resolvePoint(
  point: Point,
  viewport: Pick<WhiteboardData, "width" | "height" | "coordinateSystem">
): Point {
  if (viewport.coordinateSystem === "normalized") {
    return {
      x: point.x * viewport.width,
      y: point.y * viewport.height
    }
  }
  return point
}
