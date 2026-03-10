"use client"

import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"
// Import mhchem extension for chemistry support
import "katex/contrib/mhchem/mhchem.js"

interface MathChemRendererProps {
    text: string
}

interface TextSegment {
    type: "text" | "inline-math" | "block-math"
    content: string
}

function parseLatex(text: string): TextSegment[] {
    const segments: TextSegment[] = []

    // Pattern for block math ($$...$$) and inline math ($...$)
    // Also handles \ce{...} chemistry notation inside $ delimiters
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g

    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            segments.push({
                type: "text",
                content: text.slice(lastIndex, match.index)
            })
        }

        const matchedText = match[0]

        if (matchedText.startsWith("$$")) {
            // Block math
            segments.push({
                type: "block-math",
                content: matchedText.slice(2, -2).trim()
            })
        } else {
            // Inline math (includes \ce{} chemistry)
            segments.push({
                type: "inline-math",
                content: matchedText.slice(1, -1).trim()
            })
        }

        lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
        segments.push({
            type: "text",
            content: text.slice(lastIndex)
        })
    }

    return segments
}

function renderMath(latex: string, displayMode: boolean): string {
    try {
        return katex.renderToString(latex, {
            displayMode,
            throwOnError: false,
            errorColor: "#ff6b6b",
            trust: true,
            strict: false,
            // Enable all macros including mhchem
            macros: {
                "\\RR": "\\mathbb{R}",
                "\\NN": "\\mathbb{N}",
                "\\ZZ": "\\mathbb{Z}"
            }
        })
    } catch (error) {
        console.warn("KaTeX rendering error:", error)
        return `<span class="text-red-400">${escapeHtml(latex)}</span>`
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

export function MathChemRenderer({ text }: MathChemRendererProps) {
    const renderedContent = useMemo(() => {
        const segments = parseLatex(text)

        return segments.map((segment, index) => {
            switch (segment.type) {
                case "text":
                    return (
                        <span key={index} className="whitespace-pre-wrap">
                            {segment.content}
                        </span>
                    )
                case "inline-math":
                    return (
                        <span
                            key={index}
                            className="mx-0.5 inline-block align-middle"
                            dangerouslySetInnerHTML={{
                                __html: renderMath(segment.content, false)
                            }}
                        />
                    )
                case "block-math":
                    return (
                        <div
                            key={index}
                            className="my-3 overflow-x-auto py-2 text-center"
                            dangerouslySetInnerHTML={{
                                __html: renderMath(segment.content, true)
                            }}
                        />
                    )
                default:
                    return null
            }
        })
    }, [text])

    return <div className="math-chem-content leading-relaxed">{renderedContent}</div>
}

// Keep backward compatibility with old name
export { MathChemRenderer as MathRenderer }
