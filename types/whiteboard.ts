/**
 * Unified Whiteboard Type Definitions
 * 
 * JSON-driven schema for rendering educational content
 * on a layered whiteboard with canvas, LaTeX, charts, and tables.
 */

// ============================================
// COORDINATE TYPES
// ============================================

export interface Point {
    x: number
    y: number
}

export type Anchor = 'top-left' | 'center' | 'top-center'
export type CoordinateSystem = 'absolute' | 'normalized'

// ============================================
// BASE ELEMENT
// ============================================

export interface BaseElement {
    id: string
    x: number
    y: number
    layer?: number                    // z-index (default inferred by type)
    groupId?: string                  // group related elements
    anchor?: Anchor                   // positioning anchor (default: top-left)
    visible?: boolean                 // for step-by-step teaching (default: true)
    meta?: Record<string, unknown>    // escape hatch for future props
}

// ============================================
// CHART DATA TYPES
// ============================================

export interface ChartDataPoint {
    x: number | string
    y: number
    label?: string
}

export interface ChartDataset {
    label?: string
    data: ChartDataPoint[]
    color?: string
    fill?: boolean
}

export interface ChartData {
    labels?: string[]
    datasets: ChartDataset[]
}

export interface IntegrationConfig {
    from: number | string
    to: number | string
    shade?: boolean
}

// ============================================
// ELEMENT TYPES
// ============================================

export interface LatexElement extends BaseElement {
    type: 'latex'
    content: string
    displayMode?: boolean    // block (true) or inline (false)
    fontSize?: number
    color?: string
}

export interface ChartElement extends BaseElement {
    type: 'chart'
    chartType: 'line' | 'bar' | 'pie'
    width: number
    height: number
    // Raw data mode
    data?: ChartData
    // Math intent mode (generates data from expression)
    function?: string                              // e.g. "sin(x)", "x^2"
    domain?: [number | string, number | string]   // x-axis range
    integration?: IntegrationConfig               // shaded area under curve
}

export interface TableElement extends BaseElement {
    type: 'table'
    headers: string[]
    rows: string[][]
    borderless?: boolean
    zebra?: boolean
}

export interface TextElement extends BaseElement {
    type: 'text'
    content: string
    fontSize?: number
    color?: string
    fontWeight?: 'normal' | 'bold'
}

export interface ArrowElement extends BaseElement {
    type: 'arrow'
    from: Point
    to: Point
    color?: string
    strokeWidth?: number
    headSize?: number
}

export interface LineElement extends BaseElement {
    type: 'line'
    from: Point
    to: Point
    color?: string
    strokeWidth?: number
    dashed?: boolean
}

export interface ShapeElement extends BaseElement {
    type: 'shape'
    shapeType: 'circle' | 'rectangle' | 'ellipse'
    width: number
    height: number
    fill?: string
    stroke?: string
    strokeWidth?: number
}

// ============================================
// CHEMISTRY ELEMENT (SMILES-based)
// ============================================

export interface ReactionContext {
    reactants?: string[]
    products?: string[]
    catalyst?: string
    conditions?: string
    reactionType?: string
}

export interface ChemistryElement extends BaseElement {
    type: 'chemistry'
    smiles: string                    // SMILES notation (e.g., "c1ccccc1Br")
    label?: string                    // Display name (e.g., "Bromobenzene")
    width?: number                    // Render width (default: 200)
    height?: number                   // Render height (default: 200)
    reactionContext?: ReactionContext // Optional reaction metadata
    theme?: 'light' | 'dark'          // Color scheme
}

// ============================================
// UNION TYPE
// ============================================

export type WhiteboardElement =
    | LatexElement
    | ChartElement
    | TableElement
    | TextElement
    | ArrowElement
    | LineElement
    | ShapeElement
    | ChemistryElement

// ============================================
// ROOT CONTAINER
// ============================================

export interface WhiteboardData {
    width: number
    height: number
    coordinateSystem?: CoordinateSystem   // default: 'absolute'
    background?: string                   // background color
    elements: WhiteboardElement[]
}

// ============================================
// DEFAULT VALUES (for renderer use)
// ============================================

export const DEFAULT_LAYER_ORDER: Record<WhiteboardElement['type'], number> = {
    shape: 1,
    chart: 2,
    table: 3,
    latex: 4,
    text: 5,
    line: 6,
    arrow: 7,
    chemistry: 3  // Same level as table/chart
}

export function getDefaultLayer(type: WhiteboardElement['type']): number {
    return DEFAULT_LAYER_ORDER[type] ?? 5
}

export function resolveCoordinates(
    element: BaseElement,
    viewport: Pick<WhiteboardData, 'width' | 'height' | 'coordinateSystem'>
): Point {
    if (viewport.coordinateSystem === 'normalized') {
        return {
            x: element.x * viewport.width,
            y: element.y * viewport.height
        }
    }
    return { x: element.x, y: element.y }
}

export function resolveElementSize(
    width: number,
    height: number,
    viewport: Pick<WhiteboardData, 'width' | 'height' | 'coordinateSystem'>
): { width: number; height: number } {
    if (viewport.coordinateSystem === 'normalized') {
        return {
            width: width * viewport.width,
            height: height * viewport.height
        }
    }
    return { width, height }
}
