"use client"

import { useMemo } from "react"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine
} from "recharts"
import {
    ChartElement,
    ChartDataPoint,
    resolveCoordinates,
    resolveElementSize,
    WhiteboardData,
    getDefaultLayer
} from "@/types/whiteboard"

interface ChartRendererProps {
    element: ChartElement
    viewport: Pick<WhiteboardData, 'width' | 'height' | 'coordinateSystem'>
}

// Color palette for chart lines/bars
const CHART_COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
]

/**
 * Generates data points from a mathematical function string.
 * Supports: sin, cos, tan, sqrt, abs, log, exp, pi, e, ^
 */
function evaluateFunction(fn: string, domain: [number, number], points = 100): ChartDataPoint[] {
    const data: ChartDataPoint[] = []
    const [min, max] = domain
    const step = (max - min) / points

    for (let i = 0; i <= points; i++) {
        const x = min + i * step
        try {
            // Create a safe evaluation context
            const expression = fn
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/abs/g, 'Math.abs')
                .replace(/log/g, 'Math.log')
                .replace(/exp/g, 'Math.exp')
                .replace(/pi/gi, 'Math.PI')
                .replace(/\^/g, '**')
                .replace(/e(?![xp])/g, 'Math.E')

            // Evaluate with x in scope
            const evalFn = new Function('x', `return ${expression}`)
            const y = evalFn(x)

            if (isFinite(y)) {
                data.push({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 })
            }
        } catch {
            // Skip invalid points
        }
    }
    return data
}

/**
 * Check if domain contains pi (for symbolic axis ticks)
 */
function containsPi(domain: [number | string, number | string]): boolean {
    return domain.some(d =>
        typeof d === 'string' && d.toLowerCase().includes('pi')
    )
}

/**
 * Parse domain value (handles string expressions like "2*pi")
 */
function parseDomainValue(value: number | string): number {
    if (typeof value === 'number') return value
    const expr = value
        .replace(/pi/gi, String(Math.PI))
        .replace(/\*/g, '*')
    return eval(expr)
}

/**
 * Chart renderer with math intent support.
 * 
 * Rules:
 * - If `data` exists → render directly
 * - If `function` exists → generate data from expression
 * - Force x-axis at y=0 for function graphs
 * - Use symbolic ticks when domain contains π
 */
export function ChartRenderer({ element, viewport }: ChartRendererProps) {
    if (element.visible === false) return null

    const position = resolveCoordinates(element, viewport)
    const size = resolveElementSize(element.width, element.height, viewport)
    const zIndex = element.layer ?? getDefaultLayer('chart')

    // Generate or use existing data
    const chartData = useMemo(() => {
        if (element.data) {
            // Raw data mode
            return element.data.datasets[0]?.data ?? []
        }

        if (element.function && element.domain) {
            // Math intent mode
            const domain: [number, number] = [
                parseDomainValue(element.domain[0]),
                parseDomainValue(element.domain[1])
            ]
            return evaluateFunction(element.function, domain)
        }

        return []
    }, [element.data, element.function, element.domain])

    // Integration shading data
    const shadedData = useMemo(() => {
        if (!element.integration || !chartData.length) return null

        const from = parseDomainValue(element.integration.from)
        const to = parseDomainValue(element.integration.to)

        return chartData.filter(point => {
            const x = typeof point.x === 'number' ? point.x : parseFloat(point.x)
            return x >= from && x <= to
        })
    }, [chartData, element.integration])

    // Anchor offset
    const anchorStyles = useMemo(() => {
        switch (element.anchor) {
            case 'center':
                return { transform: 'translate(-50%, -50%)' }
            case 'top-center':
                return { transform: 'translateX(-50%)' }
            default:
                return {}
        }
    }, [element.anchor])

    // Determine if we need symbolic x-axis (π-based)
    const useSymbolicAxis = element.domain && containsPi(element.domain)

    const renderChart = () => {
        switch (element.chartType) {
            case 'line':
                // Use AreaChart if we have integration shading, else LineChart
                if (element.integration?.shade && shadedData) {
                    return (
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="x"
                                axisLine={{ stroke: '#374151' }}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                tickFormatter={useSymbolicAxis ? formatSymbolicTick : undefined}
                            />
                            <YAxis
                                axisLine={{ stroke: '#374151' }}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                            />
                            <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(255,255,255,0.95)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 8
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="y"
                                stroke={CHART_COLORS[0]}
                                fill={CHART_COLORS[0]}
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    )
                }

                return (
                    <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="x"
                            axisLine={{ stroke: '#374151' }}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickFormatter={useSymbolicAxis ? formatSymbolicTick : undefined}
                        />
                        <YAxis
                            axisLine={{ stroke: '#374151' }}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                        />
                        {element.function && <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />}
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(255,255,255,0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: 8
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="y"
                            stroke={CHART_COLORS[0]}
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                )

            case 'bar':
                return (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="x"
                            axisLine={{ stroke: '#374151' }}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                        />
                        <YAxis
                            axisLine={{ stroke: '#374151' }}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(255,255,255,0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: 8
                            }}
                        />
                        <Bar dataKey="y" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                )

            case 'pie':
                return (
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <Pie
                            data={chartData}
                            dataKey="y"
                            nameKey="x"
                            cx="50%"
                            cy="50%"
                            outerRadius="80%"
                            label={({ x }) => x}
                            labelLine
                        >
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                )

            default:
                return null
        }
    }

    return (
        <div
            className="absolute overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                zIndex,
                ...anchorStyles
            }}
        >
            <ResponsiveContainer width="100%" height="100%">
                {renderChart() || <div />}
            </ResponsiveContainer>
        </div>
    )
}

/**
 * Format tick values for π-based axes
 */
function formatSymbolicTick(value: number): string {
    const PI = Math.PI
    const tolerance = 0.01

    if (Math.abs(value) < tolerance) return '0'
    if (Math.abs(value - PI) < tolerance) return 'π'
    if (Math.abs(value + PI) < tolerance) return '-π'
    if (Math.abs(value - 2 * PI) < tolerance) return '2π'
    if (Math.abs(value + 2 * PI) < tolerance) return '-2π'
    if (Math.abs(value - PI / 2) < tolerance) return 'π/2'
    if (Math.abs(value + PI / 2) < tolerance) return '-π/2'
    if (Math.abs(value - 3 * PI / 2) < tolerance) return '3π/2'

    return value.toFixed(1)
}
