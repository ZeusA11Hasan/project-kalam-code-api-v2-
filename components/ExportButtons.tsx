"use client"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { RefObject } from "react"

type Props = {
  targetRef: RefObject<HTMLElement>
}

export default function ExportButtons({ targetRef }: Props) {
  async function exportImage() {
    if (!targetRef.current) return

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        backgroundColor: "#0b0b0b", // Match background
        useCORS: true,
        logging: false
      })

      const link = document.createElement("a")
      link.download = `whiteboard-${Date.now()}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (err) {
      console.error("Export Image Failed:", err)
    }
  }

  async function exportPDF() {
    if (!targetRef.current) return

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        backgroundColor: "#0b0b0b",
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL("image/png")

      // A4 size: 210 x 297 mm
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      // First page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`whiteboard-${Date.now()}.pdf`)
    } catch (err) {
      console.error("Export PDF Failed:", err)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportImage}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-700"
        title="Save as Image"
      >
        <span>📸</span> Image
      </button>
      <button
        onClick={exportPDF}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-700"
        title="Save as PDF"
      >
        <span>📄</span> PDF
      </button>
    </div>
  )
}
