"use client"

import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"
import { LatexElement, resolveCoordinates, WhiteboardData, getDefaultLayer } from "@/types/whiteboard"

interface LatexRendererProps {
    element: LatexElement
    viewport: Pick<WhiteboardData, 'width' | 'height' | 'coordinateSystem'>
}

/**
 * Renders a LaTeX equation at an absolute position on the whiteboard.
 * Supports both inline and display (block) modes.
 */
export function LatexRenderer({ element, viewport }: LatexRendererProps) {
    // Don't render if not visible
    if (element.visible === false) return null

    const position = resolveCoordinates(element, viewport)
    const zIndex = element.layer ?? getDefaultLayer('latex')

    // Calculate anchor offset
    const anchorStyles = useMemo(() => {
        switch (element.anchor) {
            case 'center':
                return { transform: 'translate(-50%, -50%)' }
            case 'top-center':
                return { transform: 'translateX(-50%)' }
            default: // top-left
                return {}
        }
    }, [element.anchor])

    const renderedLatex = useMemo(() => {
        try {
            return katex.renderToString(element.content, {
                displayMode: element.displayMode ?? false,
                throwOnError: false,
                errorColor: "#ff6b6b",
                trust: true,
                strict: false,
                // Physics-compatible macros (amsmath, amssymb, physics, siunitx equivalents)
                macros: {
                    // Number sets
                    "\\RR": "\\mathbb{R}",
                    "\\NN": "\\mathbb{N}",
                    "\\ZZ": "\\mathbb{Z}",
                    "\\QQ": "\\mathbb{Q}",
                    "\\CC": "\\mathbb{C}",
                    // Physics vectors (physics package)
                    "\\va": "\\vec{a}",
                    "\\vb": "\\vec{b}",
                    "\\vc": "\\vec{c}",
                    "\\vF": "\\vec{F}",
                    "\\vE": "\\vec{E}",
                    "\\vB": "\\vec{B}",
                    "\\vA": "\\vec{A}",
                    "\\vr": "\\vec{r}",
                    "\\vp": "\\vec{p}",
                    "\\vv": "\\vec{v}",
                    // Derivatives (physics package)
                    "\\dv": "\\frac{d#1}{d#2}",
                    "\\pdv": "\\frac{\\partial #1}{\\partial #2}",
                    "\\dd": "\\,d",
                    // Common physics symbols
                    "\\eps": "\\varepsilon",
                    "\\epso": "\\varepsilon_0",
                    "\\muo": "\\mu_0",
                    "\\phiE": "\\Phi_E",
                    "\\phiB": "\\Phi_B",
                    // Units (siunitx-style)
                    "\\unit": "\\,\\text{#1}",
                    "\\si": "\\,\\text{#1}",
                    "\\ohm": "\\Omega",
                    // Operators
                    "\\grad": "\\nabla",
                    "\\div": "\\nabla \\cdot",
                    "\\curl": "\\nabla \\times",
                    // Arrows
                    "\\implies": "\\Rightarrow",
                    "\\iff": "\\Leftrightarrow"
                }
            })
        } catch (error) {
            console.warn("KaTeX rendering error:", error)
            return `<span class="text-red-500">${escapeHtml(element.content)}</span>`
        }
    }, [element.content, element.displayMode])

    return (
        <div
            className="absolute pointer-events-none select-none"
            style={{
                left: position.x,
                top: position.y,
                zIndex,
                fontSize: element.fontSize ?? 16,
                color: element.color ?? '#1a1a1a',
                ...anchorStyles
            }}
            dangerouslySetInnerHTML={{ __html: renderedLatex }}
        />
    )
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}
