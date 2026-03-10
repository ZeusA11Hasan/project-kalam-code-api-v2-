"use client"

import { useMemo } from "react"
import {
  TableElement,
  resolveCoordinates,
  WhiteboardData,
  getDefaultLayer
} from "@/types/whiteboard"

interface TableRendererProps {
  element: TableElement
  viewport: Pick<WhiteboardData, "width" | "height" | "coordinateSystem">
}

/**
 * Renders an HTML table with exam-style formatting.
 * Supports borderless and zebra stripe options.
 */
export function TableRenderer({ element, viewport }: TableRendererProps) {
  // Anchor offset
  const anchorStyles = useMemo(() => {
    switch (element.anchor) {
      case "center":
        return { transform: "translate(-50%, -50%)" }
      case "top-center":
        return { transform: "translateX(-50%)" }
      default:
        return {}
    }
  }, [element.anchor])

  if (element.visible === false) return null

  const position = resolveCoordinates(element, viewport)
  const zIndex = element.layer ?? getDefaultLayer("table")

  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex,
        ...anchorStyles
      }}
    >
      <table
        className={`
          border-collapse overflow-hidden rounded-lg bg-white text-sm shadow-sm
          ${element.borderless ? "" : "border border-gray-300"}
        `}
      >
        {/* Header */}
        {element.headers.length > 0 && (
          <thead>
            <tr className="bg-gray-100">
              {element.headers.map((header, i) => (
                <th
                  key={i}
                  className={`
                    px-4 py-2 text-left font-semibold text-gray-700
                    ${element.borderless ? "" : "border border-gray-300"}
                  `}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}

        {/* Body */}
        <tbody>
          {element.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={
                element.zebra && rowIndex % 2 === 1 ? "bg-gray-50" : "bg-white"
              }
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`
                    px-4 py-2 text-gray-600
                    ${element.borderless ? "" : "border border-gray-300"}
                  `}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
