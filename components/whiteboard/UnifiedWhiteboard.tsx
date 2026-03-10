"use client"

import { useMemo } from "react"
import {
    WhiteboardData,
    getDefaultLayer
} from "@/types/whiteboard"
import { LatexRenderer } from "./renderers/LatexRenderer"
import { ChartRenderer } from "./renderers/ChartRenderer"
import { TableRenderer } from "./renderers/TableRenderer"
import { SvgOverlay } from "./renderers/SvgOverlay"
import { ChemistryRenderer } from "./renderers/ChemistryRenderer"
import InfiniteCanvas from "../InfiniteCanvas"

interface UnifiedWhiteboardProps {
    data: WhiteboardData
    className?: string
    onFullscreen?: () => void
    isFullscreen?: boolean
}

/**
 * Main unified whiteboard component.
 * Refactored to use InfiniteCanvas for Miro-like experience.
 */
export function UnifiedWhiteboard({
    data,
    className = "",
    onFullscreen,
    isFullscreen = false
}: UnifiedWhiteboardProps) {

    // Sort elements by layer (lower layers render first = behind)
    const sortedElements = useMemo(() => {
        return [...data.elements]
            .filter(el => el.visible !== false)
            .sort((a, b) => {
                const layerA = a.layer ?? getDefaultLayer(a.type)
                const layerB = b.layer ?? getDefaultLayer(b.type)
                return layerA - layerB
            })
    }, [data.elements])

    // Separate elements by type for rendering
    const latexElements = sortedElements.filter(el => el.type === 'latex')
    const chartElements = sortedElements.filter(el => el.type === 'chart')
    const tableElements = sortedElements.filter(el => el.type === 'table')
    const chemistryElements = sortedElements.filter(el => el.type === 'chemistry')
    const svgElements = sortedElements.filter(el =>
        ['text', 'arrow', 'line', 'shape'].includes(el.type)
    )

    return (
        <div className={`relative size-full${className}`}>
            <InfiniteCanvas>
                {/**
                  * Render Layers
                  * We render specificity types. 
                  * Note: SvgOverlay usually handles lines/arrows.
                  */}

                {/* Layer 1: Charts (bottom) */}
                {chartElements.map(element => (
                    <ChartRenderer
                        key={element.id}
                        element={element as any}
                        viewport={data}
                    />
                ))}

                {/* Layer 2: Tables */}
                {tableElements.map(element => (
                    <TableRenderer
                        key={element.id}
                        element={element as any}
                        viewport={data}
                    />
                ))}

                {/* Layer 2.5: Chemistry structures */}
                {chemistryElements.map(element => (
                    <ChemistryRenderer
                        key={element.id}
                        element={element as any}
                        viewport={data}
                    />
                ))}

                {/* Layer 3: LaTeX equations */}
                {latexElements.map(element => (
                    <LatexRenderer
                        key={element.id}
                        element={element as any}
                        viewport={data}
                    />
                ))}

                {/* Layer 4: SVG overlay (text, arrows, lines, shapes) - top */}
                {/* We pass a custom viewport to ensure SVG overlay doesn't clip if implementation relies on width/height */}
                <SvgOverlay elements={svgElements} viewport={{ ...data, width: 20000, height: 20000 }} />

            </InfiniteCanvas>
        </div>
    )
}

// Re-export types for convenience
export type { WhiteboardData, WhiteboardElement } from "@/types/whiteboard"
