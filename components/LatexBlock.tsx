"use client"

import katex from "katex"
import "katex/dist/katex.min.css"

type Props = {
  latex: string | null
}

export default function LatexBlock({ latex }: Props) {
  if (!latex) return null

  let html = ""

  try {
    html = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
      strict: "warn"
    })
  } catch {
    html = "<span style='color:red'>Invalid LaTeX</span>"
  }

  return (
    <div
      className="latex-block"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        background: "#0b0b0b",
        padding: "12px 16px",
        borderRadius: "10px",
        marginBottom: "12px",
        overflowX: "auto",
        color: "#fff" // Ensure text is visible on dark background
      }}
    />
  )
}
