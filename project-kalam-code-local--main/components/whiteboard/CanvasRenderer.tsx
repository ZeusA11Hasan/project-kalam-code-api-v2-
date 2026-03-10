"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Text, Circle, Rect, Arrow, Shape } from 'react-konva';
import { WhiteboardCommand } from '@/lib/whiteboard-parser';
import { Button } from '@/components/ui/button';
import { Download, Undo, Redo, Trash } from 'lucide-react';

// Extended command interface to support all shapes
interface ExtendedWhiteboardCommand extends WhiteboardCommand {
    // Circle
    center?: [number, number];
    radius?: number;
    // Rectangle
    width?: number;
    height?: number;
    // Common
    color?: string;
    fill?: boolean;
    fontSize?: number;
}

interface CanvasRendererProps {
    commands: ExtendedWhiteboardCommand[];
    width?: number;
    height?: number;
    scale?: number;
    onExport?: (dataUrl: string) => void;
}

export default function CanvasRenderer({
    commands,
    width = 800,
    height = 600,
    scale: externalScale,
    onExport: onExternalExport
}: CanvasRendererProps) {
    const stageRef = useRef<any>(null);
    const [internalScale, setInternalScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [history, setHistory] = useState<ExtendedWhiteboardCommand[][]>([[]]);
    const [historyStep, setHistoryStep] = useState(0);

    // Use external scale if provided, otherwise use internal
    const currentScale = externalScale ?? internalScale;

    useEffect(() => {
        if (commands.length > 0) {
            setHistory([commands]);
            setHistoryStep(0);
        }
    }, [commands]);

    const currentCommands = history[historyStep] || [];
    console.log('CanvasRenderer currentCommands:', currentCommands);

    const handleWheel = (e: any) => {
        if (externalScale !== undefined) return; // Zoom controlled externally
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        setInternalScale(newScale);
        setPosition({
            x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        });
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
        }
    };

    const handleClear = () => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push([]);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const handleExport = () => {
        const uri = stageRef.current.toDataURL();
        if (onExternalExport) {
            onExternalExport(uri);
        } else {
            const link = document.createElement('a');
            link.download = 'whiteboard.png';
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const renderCommand = (c: ExtendedWhiteboardCommand, i: number) => {
        const strokeColor = c.color || 'black';
        const strokeWidth = 2;

        switch (c.type) {
            case 'line':
                if (!c.from || !c.to) return null;
                return (
                    <Line
                        key={i}
                        points={[...c.from, ...c.to]}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        lineCap="round"
                        lineJoin="round"
                    />
                );

            case 'curve':
                if (!c.points) return null;
                const pts = c.points.flat();
                return (
                    <Line
                        key={i}
                        points={pts}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                    />
                );

            case 'label':
                if (!c.position) return null;
                return (
                    <Text
                        key={i}
                        x={c.position[0]}
                        y={c.position[1]}
                        text={c.text || ''}
                        fontSize={c.fontSize || 16}
                        fill={strokeColor}
                    />
                );

            case 'circle' as any:
                if (!c.center || !c.radius) return null;
                return (
                    <Circle
                        key={i}
                        x={c.center[0]}
                        y={c.center[1]}
                        radius={c.radius}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        fill={c.fill ? strokeColor : undefined}
                    />
                );

            case 'rectangle' as any:
                if (!c.position || !c.width || !c.height) return null;
                return (
                    <Rect
                        key={i}
                        x={c.position[0]}
                        y={c.position[1]}
                        width={c.width}
                        height={c.height}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        fill={c.fill ? strokeColor : undefined}
                    />
                );

            case 'arrow' as any:
                if (!c.from || !c.to) return null;
                return (
                    <Arrow
                        key={i}
                        points={[...c.from, ...c.to]}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        fill={strokeColor}
                        pointerLength={10}
                        pointerWidth={10}
                    />
                );

            case 'bezier' as any:
                if (!c.start || !c.end || !c.control1 || !c.control2) return null;
                return (
                    <Shape
                        key={i}
                        sceneFunc={(context: any, shape: any) => {
                            context.beginPath();
                            context.moveTo(c.start!.x, c.start!.y);
                            context.bezierCurveTo(
                                c.control1!.x, c.control1!.y,
                                c.control2!.x, c.control2!.y,
                                c.end!.x, c.end!.y
                            );
                            context.fillStrokeShape(shape);
                        }}
                        stroke={c.color || strokeColor}
                        strokeWidth={c.width || strokeWidth}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="relative overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="absolute right-2 top-2 z-10 flex gap-2">
                <Button variant="outline" size="icon" onClick={handleUndo} disabled={historyStep === 0}>
                    <Undo className="size-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleRedo} disabled={historyStep === history.length - 1}>
                    <Redo className="size-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleClear}>
                    <Trash className="size-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleExport}>
                    <Download className="size-4" />
                </Button>
            </div>

            <Stage
                width={width}
                height={height}
                onWheel={handleWheel}
                scaleX={currentScale}
                scaleY={currentScale}
                x={position.x}
                y={position.y}
                draggable
                ref={stageRef}
                className="cursor-move"
            >
                <Layer>
                    {currentCommands.map((c, i) => renderCommand(c, i))}
                </Layer>
            </Stage>
        </div>
    );
}
