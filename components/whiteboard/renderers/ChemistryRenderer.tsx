"use client"

import { useEffect, useRef, useMemo, useState } from "react"
import {
  ChemistryElement,
  resolveCoordinates,
  WhiteboardData,
  getDefaultLayer
} from "@/types/whiteboard"

interface ChemistryRendererProps {
  element: ChemistryElement
  viewport: Pick<WhiteboardData, "width" | "height" | "coordinateSystem">
}

// RDKit module type
interface RDKitModule {
  get_mol: (smiles: string) => RDKitMol | null
  version: () => string
}

interface RDKitMol {
  get_svg: (width?: number, height?: number) => string
  delete: () => void
}

// Global RDKit instance
let rdkitInstance: RDKitModule | null = null
let rdkitLoading: Promise<RDKitModule> | null = null

// Load RDKit from CDN (WebAssembly)
async function loadRDKit(): Promise<RDKitModule> {
  if (rdkitInstance) return rdkitInstance

  if (rdkitLoading) return rdkitLoading

  rdkitLoading = new Promise<RDKitModule>((resolve, reject) => {
    // Check if already loaded
    if ((window as any).RDKit) {
      rdkitInstance = (window as any).RDKit
      resolve(rdkitInstance!)
      return
    }

    // Load RDKit from CDN
    const script = document.createElement("script")
    script.src = "https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js"
    script.async = true

    script.onload = () => {
      // Initialize RDKit
      ;(window as any)
        .initRDKitModule()
        .then((RDKit: RDKitModule) => {
          rdkitInstance = RDKit
          ;(window as any).RDKit = RDKit
          console.log("RDKit.js loaded, version:", RDKit.version())
          resolve(RDKit)
        })
        .catch(reject)
    }

    script.onerror = () => reject(new Error("Failed to load RDKit.js"))
    document.head.appendChild(script)
  })

  return rdkitLoading
}

/**
 * Chemistry Renderer Component
 *
 * Renders chemical structures from SMILES notation using RDKit.js (WebAssembly).
 * Supports ANY valid SMILES string - benzene, glucose, complex molecules.
 *
 * RULES:
 * - AI outputs ONLY SMILES notation (e.g., "c1ccccc1Br", "OC[C@H]1OC...")
 * - RDKit.js handles all rendering (rule-based, not AI-drawn)
 * - Aromatic rings displayed correctly
 * - Stereochemistry preserved
 */
export function ChemistryRenderer({
  element,
  viewport
}: ChemistryRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const position = resolveCoordinates(element, viewport)
  const zIndex = element.layer ?? getDefaultLayer("chemistry")
  const width = element.width ?? 200
  const height = element.height ?? 200

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

  useEffect(() => {
    if (typeof window === "undefined") return
    if (element.visible === false) return

    setIsLoading(true)
    setError(null)
    setSvgContent(null)

    const renderMolecule = async () => {
      try {
        const RDKit = await loadRDKit()

        // Parse SMILES and get molecule
        const mol = RDKit.get_mol(element.smiles)

        if (!mol) {
          setError(`Invalid SMILES`)
          setIsLoading(false)
          return
        }

        // Generate SVG
        const svg = mol.get_svg(width, height)
        setSvgContent(svg)

        // Clean up
        mol.delete()
        setIsLoading(false)
      } catch (err) {
        console.error("RDKit render error:", err)
        setError("Render failed")
        setIsLoading(false)
      }
    }

    renderMolecule()
  }, [element.smiles, element.visible, width, height])

  // Don't render if not visible
  if (element.visible === false) return null

  return (
    <div
      ref={containerRef}
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex,
        ...anchorStyles
      }}
    >
      {/* SVG Container */}
      <div
        className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
        style={{ width, height }}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="flex size-full items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2">
              <div className="size-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-xs text-gray-400">Loading RDKit...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex size-full items-center justify-center bg-red-50">
            <div className="text-center">
              <div className="text-sm font-medium text-red-500">{error}</div>
              <div className="mt-1 font-mono text-xs text-red-400">
                {element.smiles.slice(0, 20)}...
              </div>
            </div>
          </div>
        )}

        {/* SVG output from RDKit */}
        {svgContent && !isLoading && !error && (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="size-full"
          />
        )}
      </div>

      {/* Label below structure */}
      {element.label && (
        <div className="mt-1 text-center text-xs font-medium text-gray-600">
          {element.label}
        </div>
      )}
    </div>
  )
}
