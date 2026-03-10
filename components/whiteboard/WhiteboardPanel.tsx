"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import {
  IconX,
  IconCamera,
  IconTrash,
  IconPencil,
  IconZoomIn,
  IconZoomOut
} from "@tabler/icons-react"
import dynamic from "next/dynamic"
import { parseWhiteboardCommands } from "@/lib/whiteboard-parser"
import "./whiteboard.css"

// Dynamically import CanvasRenderer to avoid SSR issues with Konva
const CanvasRenderer = dynamic(() => import("./CanvasRenderer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      Loading Canvas...
    </div>
  )
})

interface WhiteboardPanelProps {
  commands?: any[]
  onClose: () => void
  onScreenshotAnalysis?: (imageData: string) => void
}

export const WhiteboardPanel: React.FC<WhiteboardPanelProps> = ({
  commands,
  onClose,
  onScreenshotAnalysis
}) => {
  const [scale, setScale] = useState(1)
  const [parsedCommands, setParsedCommands] = useState<any[]>([])

  // Parse commands whenever they change
  useEffect(() => {
    if (commands && commands.length > 0) {
      // Check if commands are already objects (from JSON AI response)
      if (typeof commands[0] === "object") {
        setParsedCommands(commands)
      } else {
        // Legacy string parsing
        const cmdsToParse = commands.join("\n")
        const parsed = parseWhiteboardCommands(cmdsToParse)
        setParsedCommands(parsed)
      }
    }
  }, [commands])

  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.5))

  const handleExport = (dataUrl: string) => {
    if (onScreenshotAnalysis) {
      onScreenshotAnalysis(dataUrl)
    }
  }

  useEffect(() => {
    console.log("WhiteboardPanel mounted")
  }, [])

  return (
    <div className="whiteboard-panel z-[9999] flex h-full flex-col border-l border-gray-200 bg-white shadow-xl">
      <div className="whiteboard-header flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-700">AI Whiteboard</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 transition-colors hover:bg-gray-200"
          aria-label="Close whiteboard"
        >
          <IconX size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="whiteboard-toolbar flex items-center gap-2 border-b border-gray-200 bg-white p-2">
        <button
          onClick={handleZoomIn}
          className="rounded p-2 hover:bg-gray-100"
          title="Zoom In"
        >
          <IconZoomIn size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="rounded p-2 hover:bg-gray-100"
          title="Zoom Out"
        >
          <IconZoomOut size={18} />
        </button>
        <span className="text-xs text-gray-500">
          {Math.round(scale * 100)}%
        </span>

        <div className="grow" />

        {/* Placeholder for future tools */}
        {/* 
                <button className="p-2 hover:bg-gray-100 rounded text-blue-500" title="Pen">
                    <IconPencil size={18} />
                </button>
                */}
      </div>

      <div className="whiteboard-container relative grow overflow-hidden bg-gray-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <CanvasRenderer
            commands={parsedCommands}
            width={800}
            height={600}
            scale={scale}
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  )
}
